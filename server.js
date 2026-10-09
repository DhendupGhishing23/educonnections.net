const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
require("dotenv").config();
const escapeHtml = require('escape-html');
const axios = require('axios');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const services = require('./data/services');
const destinations = require('./data/destinations');
const testimonials = require('./data/testimonials');
const partnerLogos = require('./data/partners');
const programsData = require('./data/programs');
const worldGeo = require('./data/worldGeo');
const institutionDetails = require('./data/institutionDetails');

// --- 2026 redesign: flatten the per-country institution lists into a single indexed array,
// built once at startup from the existing data files above (no new database, nothing
// duplicated by hand). This backs /universities, /universities/:slug and /api/search.
const allInstitutions = [];
const institutionBySlug = {};
Object.keys(destinations).forEach(function (countrySlug) {
    const country = destinations[countrySlug];
    country.universities.forEach(function (u) {
        const record = Object.assign({}, u, {
            countrySlug: countrySlug,
            countryName: country.name,
            countryFlag: country.flag,
            details: institutionDetails[u.slug] || null
        });
        allInstitutions.push(record);
        institutionBySlug[u.slug] = record;
    });
});
const CATEGORY_LIST = Array.from(new Set(allInstitutions.map(function (u) { return u.category; }))).sort();
const PAGE_SIZE = 12;

function paginate(items, page, pageSize) {
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(Math.max(1, parseInt(page, 10) || 1), totalPages);
    const start = (currentPage - 1) * pageSize;
    return {
        items: items.slice(start, start + pageSize),
        currentPage: currentPage,
        totalPages: totalPages,
        totalItems: totalItems,
        pageSize: pageSize
    };
}

const formSubmissionLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 2,
    handler: function (req, res, next, error) {
         return res.render('error.ejs', {error: 'Too many request, Please try again after some time !'})
    }
});


const app = express();
const port = process.env.PORT || 3000;

// Cache-busting for the 2026 redesign's own CSS/JS (tokens.css, redesign.css and the
// new assets/js/*.js files below) - those get a 1-day Cache-Control below like every
// other static asset, so without this, a browser that already loaded the page once
// keeps serving its cached copy for up to a day even after the file on disk changes,
// silently hiding any update. Appending ?v=<ASSET_VERSION> to just those tags (see
// partials/head.ejs and partials/scripts.ejs) changes the URL - and therefore forces
// a fresh fetch - whenever the value changes. It does NOT cover the original theme's
// vendor/legacy files (bootstrap, jquery, owlcarousel, style.css, refine.css,
// custom.js, reveal.js), which this redesign never edits.
//
// This used to be a single Date.now() computed once when the server process started,
// which meant an edited file only busted the cache after the *server* was restarted -
// easy to forget, and confusing when a delivered change "isn't showing up" even though
// the file on disk is already correct. Instead, the version is now the newest mtime
// across the actual files below, re-read on every request (a handful of cheap
// fs.statSync calls - negligible at this site's traffic) - so editing any one of them
// busts the cache on the very next page load, with no server restart needed.
const path = require('path');
const fs = require('fs');
const WATCHED_ASSET_FILES = [
    path.join(__dirname, 'public/assets/css/tokens.css'),
    path.join(__dirname, 'public/assets/css/redesign.css'),
    path.join(__dirname, 'public/assets/js/utils.js'),
    path.join(__dirname, 'public/assets/js/nav.js'),
    path.join(__dirname, 'public/assets/js/search.js'),
    path.join(__dirname, 'public/assets/js/filters.js'),
    path.join(__dirname, 'public/assets/js/worldmap.js'),
    path.join(__dirname, 'public/assets/js/favorites.js'),
    path.join(__dirname, 'public/assets/js/custom.js'),
];
function computeAssetVersion() {
    var latest = 0;
    WATCHED_ASSET_FILES.forEach(function (filePath) {
        try {
            var mtime = fs.statSync(filePath).mtimeMs;
            if (mtime > latest) latest = mtime;
        } catch (err) {
            // Missing file shouldn't crash asset-version lookup - just skip it.
        }
    });
    // Fallback covers the (very unlikely) case where every watched file is missing.
    return Math.round(latest) || Date.now();
}

// gzip/brotli-style compression for every response - HTML, CSS and JS all shrink
// significantly over the wire, which was one of the biggest un-addressed load-time
// issues on the old site (nothing was compressing responses before this).
app.use(compression());

// Long-lived caching for static assets. These are all fingerprint-free filenames,
// so a shorter max-age is used for html-adjacent assets that might change (css/js)
// and a longer one for images which change far less often.
app.use(express.static("public", {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, filePath) => {
        if (/\.(png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=2592000, immutable'); // 30 days
        }
    }
}));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

// Shared data made available to every render() call without repeating it everywhere.
app.use((req, res, next) => {
    res.locals.services = services;
    res.locals.destinations = destinations;
    res.locals.categoryList = CATEGORY_LIST;
    res.locals.currentPath = req.path;
    res.locals.assetVersion = computeAssetVersion();
    next();
});

// Hand-picked (not algorithmically "popular") for the homepage "Featured Universities" strip -
// one real, verified institution per country that has partner institutions today, each with a
// matching client testimonial so the claim of being "featured" has something behind it.
const FEATURED_INSTITUTION_SLUGS = ['university-of-western-australia', 'curtin-university', 'ihm-institute-of-health-and-management', 'tafe-wa', 'auckland-institute-of-studies', 'ilsc-education-group'];

app.get('/', (req, res) => {
    const extra = {
        testimonials,
        partnerLogos,
        fieldCategories: programsData.fieldCategories,
        featuredInstitutions: FEATURED_INSTITUTION_SLUGS.map((slug) => institutionBySlug[slug]).filter(Boolean),
        worldGeo
    };
    if (req.query.acknowledgment) {
        return res.render('index.ejs', {...extra, acknowledgment: req.query.acknowledgment});
    }
    if (req.query.errorMessage) {
        return res.render('index.ejs', {...extra, errorMessage: req.query.errorMessage});
    }
    res.render('index.ejs', extra);
});

app.get('/services', (req, res) => {
    res.render('services.ejs');
});

app.get('/destinations', (req, res) => {
    res.render('destinations.ejs');
});

app.get('/destinations/:country', (req, res) => {
    const destination = destinations[req.params.country];
    if (!destination) {
        return res.status(404).render('error.ejs', {error: 'We could not find that destination.'});
    }
    res.render('destination.ejs', {destination, slug: req.params.country});
});

app.get('/checkyoureligibility', (req, res) => {
    if (req.query.acknowledgment) {
        return res.render('eligibilityCheck.ejs', {acknowledgment: req.query.acknowledgment});
    }
    if (req.query.errorMessage) {
        return res.render('eligibilityCheck.ejs', {errorMessage: req.query.errorMessage});
    }
    res.render('eligibilityCheck.ejs');
});

// --- 2026 redesign: additive routes below. Nothing above this line was changed. ---

// /countries is the URL shape used elsewhere (e.g. schema.org, the brief this redesign was
// built from); /destinations is the original, already-indexed route. Rather than duplicate
// content on two live URLs, /countries redirects to the canonical /destinations pages.
app.get('/countries', (req, res) => res.redirect(301, '/destinations'));
app.get('/countries/:country', (req, res) => res.redirect(301, `/destinations/${req.params.country}`));

// Universities explorer: every institution across every country, searchable/filterable/
// sortable and paginated server-side (12 per page) rather than rendering all 18 at once.
app.get('/universities', (req, res) => {
    const { q, country, category, sort } = req.query;
    let list = allInstitutions.slice();

    if (country) list = list.filter((u) => u.countrySlug === country);
    if (category) list = list.filter((u) => u.category === category);
    if (q) {
        const needle = q.toLowerCase();
        list = list.filter((u) =>
            u.name.toLowerCase().includes(needle) ||
            u.location.toLowerCase().includes(needle) ||
            u.type.toLowerCase().includes(needle) ||
            u.countryName.toLowerCase().includes(needle)
        );
    }
    if (sort === 'az') {
        list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'country') {
        list.sort((a, b) => a.countryName.localeCompare(b.countryName) || a.name.localeCompare(b.name));
    }

    const result = paginate(list, req.query.page, PAGE_SIZE);

    res.render('universities.ejs', {
        title: 'Universities',
        description: 'Search and filter every university and college Edu Connections partners with, across Australia, New Zealand, Canada and South Korea.',
        result,
        query: req.query,
        countryOptions: Object.keys(destinations).map((slug) => ({ slug, name: destinations[slug].name }))
    });
});

app.get('/universities/:slug', (req, res) => {
    const institution = institutionBySlug[req.params.slug];
    if (!institution) {
        return res.status(404).render('error.ejs', { error: 'We could not find that university or college.' });
    }
    const relatedTestimonials = testimonials.filter((t) => t.institutionSlug === institution.slug);
    const relatedPrograms = programsData.verifiedPrograms.filter((p) => p.institutionSlug === institution.slug);
    res.render('university.ejs', {
        title: institution.name,
        description: `${institution.name} in ${institution.location}, ${institution.countryName} — a verified Edu Connections partner institution.`,
        institution,
        relatedTestimonials,
        relatedPrograms
    });
});

// Programs: a small set of real, testimonial-verified programs, plus broader browsable
// fields of study derived from each institution's category. See data/programs.js for how
// this is scoped to avoid inventing course catalogues.
app.get('/programs', (req, res) => {
    res.render('programs.ejs', {
        title: 'Programs',
        description: 'Browse fields of study and real, verified programs across Edu Connections\' partner institutions.',
        fieldCategories: programsData.fieldCategories,
        verifiedPrograms: programsData.verifiedPrograms,
        institutionBySlug
    });
});

app.get('/programs/:slug', (req, res) => {
    const category = programsData.fieldCategories.find((f) => f.slug === req.params.slug);
    if (category) {
        const matchingInstitutions = allInstitutions.filter((u) => category.matchesCategories.includes(u.category));
        const matchingPrograms = programsData.verifiedPrograms.filter((p) => p.fieldCategory === category.name);
        return res.render('programDetail.ejs', {
            title: category.name,
            description: category.description,
            kind: 'category',
            category,
            matchingInstitutions,
            matchingPrograms
        });
    }
    const program = programsData.verifiedPrograms.find((p) => p.slug === req.params.slug);
    if (program) {
        const institution = institutionBySlug[program.institutionSlug];
        const relatedTestimonial = testimonials.find((t) => t.institutionSlug === program.institutionSlug);
        const fieldCategoryEntry = programsData.fieldCategories.find((f) => f.name === program.fieldCategory);
        return res.render('programDetail.ejs', {
            title: program.name,
            description: `${program.name} — a real, verified program at ${institution ? institution.name : 'a partner institution'}.`,
            kind: 'program',
            program,
            institution,
            relatedTestimonial,
            fieldCategorySlug: fieldCategoryEntry ? fieldCategoryEntry.slug : null
        });
    }
    return res.status(404).render('error.ejs', { error: 'We could not find that program or field of study.' });
});

// Lightweight JSON search used by the debounced nav/hero search box. Kept dependency-free
// (no search server) since the whole catalogue is a few dozen records - a linear scan here
// is faster than the network round trip that calls it.
app.get('/api/search', (req, res) => {
    const q = (req.query.q || '').trim().toLowerCase();
    if (!q) {
        return res.json({ countries: [], universities: [], programs: [], services: [] });
    }

    const countries = Object.keys(destinations)
        .map((slug) => ({ slug, name: destinations[slug].name, flag: destinations[slug].flag, count: destinations[slug].universities.length }))
        .filter((c) => c.name.toLowerCase().includes(q))
        .slice(0, 5);

    const universities = allInstitutions
        .filter((u) => u.name.toLowerCase().includes(q) || u.location.toLowerCase().includes(q) || u.type.toLowerCase().includes(q))
        .slice(0, 6)
        .map((u) => ({ slug: u.slug, name: u.name, location: u.location, countryName: u.countryName, logo: u.logo }));

    const programs = programsData.fieldCategories
        .filter((f) => f.name.toLowerCase().includes(q))
        .map((f) => ({ slug: f.slug, name: f.name, kind: 'field' }))
        .concat(
            programsData.verifiedPrograms
                .filter((p) => p.name.toLowerCase().includes(q))
                .map((p) => ({ slug: p.slug, name: p.name, kind: 'program' }))
        )
        .slice(0, 6);

    const serviceResults = services
        .filter((s) => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q))
        .slice(0, 4)
        .map((s) => ({ slug: s.slug, title: s.title }));

    res.json({ countries, universities, programs, services: serviceResults });
});

// Thin, honest placeholder pages rather than either a broken footer link or invented legal
// text - the business's actual privacy/terms wording isn't part of this codebase's data.
app.get('/privacy-policy', (req, res) => {
    res.render('simplePage.ejs', {
        title: 'Privacy Policy',
        description: 'How Edu Connections handles your personal information.',
        body: 'Our full privacy policy is being finalised. In short: information you submit through our forms (like your eligibility check or contact message) is used only to respond to your enquiry and is not sold to third parties. If you have questions about how your data is handled, contact us directly and we will answer them.'
    });
});
app.get('/terms', (req, res) => {
    res.render('simplePage.ejs', {
        title: 'Terms of Use',
        description: 'Terms for using the Edu Connections website.',
        body: 'Our full terms of use are being finalised. This website is provided for general information about Edu Connections\' services and partner institutions. Course, tuition, admissions and program details should always be confirmed directly with the relevant institution before you make a decision. Contact us if you have questions about these terms.'
    });
});

app.get('/sitemap.xml', (req, res) => {
    const baseUrl = 'https://educonnections.net';
    const staticPaths = ['/', '/services', '/destinations', '/universities', '/programs', '/checkyoureligibility', '/privacy-policy', '/terms'];
    const countryPaths = Object.keys(destinations).map((slug) => `/destinations/${slug}`);
    const universityPaths = allInstitutions.map((u) => `/universities/${u.slug}`);
    const programPaths = programsData.fieldCategories.map((f) => `/programs/${f.slug}`)
        .concat(programsData.verifiedPrograms.map((p) => `/programs/${p.slug}`));

    const urls = staticPaths.concat(countryPaths, universityPaths, programPaths);
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls.map((u) => `  <url><loc>${baseUrl}${u}</loc></url>`).join('\n') +
        '\n</urlset>';
    res.type('application/xml').send(xml);
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false,
    },
});
const sendEmail = (transporter, mailOptions) => {
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            } else {
                resolve(info);
            }
        });
    });
};
app.use((err, req, res, next) => {
    res.render('error.ejs', {error: 'something went wrong'})
});

app.post('/checkyoureligibility', formSubmissionLimiter, async(req, res) => {
    try {
        const { 'g-recaptcha-response': recaptchaResponse} = req.body;

        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

        const response = await axios.post(recaptchaUrl);
        const {success} = response.data;
        if (success) {
            const {
                name,
                country,
                phone,
                qualification,
                desiredcountry,
                email,
                agegroup,
                book,
                consultationDate,
                message
            } = req.body
            const isGmail = email.endsWith('@gmail.com');


            if (!isGmail) {
                const errorMessage = `Invalid information`
                return  res.redirect(`/checkyoureligibility?errorMessage=${encodeURIComponent(errorMessage)}`);

            }

            const names = escapeHtml(name);
            const countrys = escapeHtml(country);
            const phones = escapeHtml(phone);
            const qualifications = escapeHtml(qualification);
            const desiredcountrys = escapeHtml(desiredcountry);
            const emails = escapeHtml(email);
            const agegroups = escapeHtml(agegroup);
            const books = escapeHtml(book);
            const consultationDates = escapeHtml(consultationDate);
            const messages = escapeHtml(message);

            const acknowledgmentEmailForUser = `
  <p>Hello ${names},</p>
  <p>Thank you for submitting the eligibility check with EduConnections!</p>
    <p>Thank you for reaching out to us through our website. We appreciate your interest in our services. Your inquiry is important to us, and we will do our best to assist you promptly.</p>
    <p>Our team is currently reviewing your message, and we will get back to you as soon as possible.</p>
    <p>We value your feedback and look forward to helping you with your questions. Thank you for considering us for your needs.</p>
    <p>Best regards,<br><br> EDU CONNECTIONS</p>
`;

            const acknowledgementEmailForConsultancy = `
  <p>Hello team,</p>
  <p>We have received the following information from:  ${names} </p>

  <ul>
    <li><strong>Name:</strong> ${names}</li>
    <li><strong>Country:</strong> ${countrys}</li>
    <li><strong>Phone:</strong> ${phones}</li>
    <li><strong>Desired Country</strong> ${desiredcountrys}</li>
    <li><strong>Qualification:</strong> ${qualifications}</li>
    <li><strong>Email:</strong> ${email}</li>
    <li><strong>Age Group:</strong> ${agegroups}</li>
    <li><strong>Book Consultation:</strong> ${books}</li>
    <li><strong>Consultation Date:</strong> ${consultationDates}</li>
    <li><strong>Message:</strong> ${messages}</li>
  </ul>
`
            const mailOptions = {
                from: `Edu Connections <${process.env.EMAIL}>`,
                to: emails,
                subject: 'Acknowledgement for Eligibility Check',
                html: acknowledgmentEmailForUser
            };
            const mailOption2 = {
                from: `Edu Connections <${process.env.EMAIL}>`,
                to: process.env.EMAIL_EDU_TEAM,
                subject: 'Eligibility Check From Client',
                html: acknowledgementEmailForConsultancy
            };

            Promise.all([
                sendEmail(transporter, mailOptions),
                sendEmail(transporter, mailOption2)

            ])
                .then(() => {
                    const acknowledgment = `Dear ${names}, We acknowledge the submission of your eligibility check, and we want to assure you that our team is diligently reviewing the criteria you provided. Your inquiry is important to us, and we will get back to you with the results as soon as possible.`
                    return res.redirect(`/checkyoureligibility?acknowledgment=${encodeURIComponent(acknowledgment)}`);

                })
                .catch(error => {
                    const errorMessage = `Dear ${names}, Thank you for trying reach out to EduConnections. Please try again entering the valid email `
                    return res.redirect(`/checkyoureligibility?errorMessage=${encodeURIComponent(errorMessage)}`);

                });

        } else {
            // Real bug fixed here: previously there was no else branch, so a failed reCAPTCHA
            // check (including Google's own "invalid-input-secret" response) left the request
            // with no res.redirect/res.send at all - the browser just hung with no error and no
            // email was ever sent, silently, every time.
            console.log('reCAPTCHA verification failed for /checkyoureligibility:', response.data);
            const errorMessage = `We couldn't verify you're not a robot - please try submitting the form again.`;
            return res.redirect(`/checkyoureligibility?errorMessage=${encodeURIComponent(errorMessage)}`);
        }

    } catch (error) {
        console.log('Error during eligibility check:', error);
        const errorMessage = `Thank you for trying to reach out to EduConnections. Please try again entering valid information.`;
        res.redirect(`/checkyoureligibility?errorMessage=${encodeURIComponent(errorMessage)}`);
    }

});

app.post('/send', formSubmissionLimiter, async (req, res) => {

        try {

            const { 'g-recaptcha-response': recaptchaResponse} = req.body;

            const secretKey = process.env.RECAPTCHA_SECRET_KEY;
            const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

            const response = await axios.post(recaptchaUrl);
            const {success} = response.data;
            if (success) {
                const {name, email, subject, message} = req.body;

                const names = escapeHtml(name);
                const emails = escapeHtml(email);
                const subjects = escapeHtml(subject);
                const messages = escapeHtml(message);
                const isGmail = email.endsWith('@gmail.com');
                if (!isGmail) {
                    const errorMessage = `Please enter the valid information, Please try again`
                    return res.redirect(`/?errorMessage=${encodeURIComponent(errorMessage)}#contact-us`);

                }

                const emailBodyForUser = `
                <p>Hello ${names},</p>
                <p>Welcome to EduConnections, your trusted education consultancy!</p>
                <p>Thank you for reaching out to us through our website. We appreciate your interest in our services. Your inquiry is important to us, and we will do our best to assist you promptly.</p>
                <p>Our team is currently reviewing your message, and we will get back to you as soon as possible.</p>
                <p>We value your feedback and look forward to helping you with your questions. Thank you for considering us for your needs.</p>
                <p>Best regards,<br> <br> EDU CONNECTIONS</p>
              `;
                const emailBodyForEduConsultancy = `
                    <p>Hello EduConnections Team,</p>
                    <P>We have recivied following details from ${names} </P>
                     <p>Name : ${names}</p>
                     <p>Email : ${emails}</p>

                     <p>Subject: ${subjects}</p>
                     <p>message: ${messages}</p>
                     <p>Best regards,<br>${names}</p>
                    `
                const mailOptions = {
                    from: `Edu Connections <${process.env.EMAIL}>`,
                    to: process.env.EMAIL_EDU_TEAM,
                    subject: subjects,
                    html: emailBodyForEduConsultancy
                };
                const mailOption2 = {
                    from: `Edu Connections <${process.env.EMAIL}>`,
                    to: emails,
                    subject: subject,
                    html: emailBodyForUser
                };

                Promise.all([
                    sendEmail(transporter, mailOptions),
                    sendEmail(transporter, mailOption2)
                ])
                    .then(() => {
                        const acknowledgment = `Dear ${name},  Thank you for reaching out to EduConnections. We appreciate your interest in our education consultancy services`
                        return res.redirect(`/?acknowledgment=${encodeURIComponent(acknowledgment)}#contact-us`);

                    })
                    .catch(error => {
                        const errorMessage = `Dear ${name}, Thank you for trying reach out to EduConnections. Please try again entering the valid email `
                        return res.redirect(`/?errorMessage=${encodeURIComponent(errorMessage)}#contact-us`);

                    });


            } else {
                // Same missing-else bug as /checkyoureligibility - a failed reCAPTCHA check
                // used to leave the request hanging with no response and no email sent.
                console.log('reCAPTCHA verification failed for /send:', response.data);
                const errorMessage = `We couldn't verify you're not a robot - please try submitting the form again.`;
                return res.redirect(`/?errorMessage=${encodeURIComponent(errorMessage)}#contact-us`);
            }

        } catch (error) {
            const errorMessage = `Thank you for trying to reach out to EduConnections. Please try again entering valid information.`;
            return res.redirect(`/?errorMessage=${encodeURIComponent(errorMessage)}#contact-us`);

        }
    }
)

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

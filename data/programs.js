// Real, named programs and broad fields of study.
//
// `verifiedPrograms` is deliberately short: these are the ONLY specific program names that
// exist anywhere in this codebase's data, each one taken directly from a real client
// testimonial in data/testimonials.js (not invented, not scraped from an institution's course
// catalogue). No duration, fee or curriculum details are included because none were stated -
// the university/program pages show "Information unavailable" for those instead of guessing.
//
// `fieldCategories` is a broader, browsable grouping built from the `category`/`type` values
// already on each institution in data/destinations.js (e.g. every "Vocational / TAFE"
// institution supports the "Vocational & TAFE Diplomas" field). This powers /programs and the
// search index without claiming any specific course exists at a specific institution beyond
// what's verified above.
const verifiedPrograms = [
    {
        slug: 'master-of-nursing',
        name: 'Master of Nursing',
        level: 'Postgraduate',
        fieldCategory: 'Nursing & Health',
        institutionSlug: 'ihm-institute-of-health-and-management',
        countrySlug: 'australia',
        source: 'Client testimonial — Oh Eunjoo, student at IHM'
    },
    {
        slug: 'bachelor-of-pharmacy',
        name: 'Bachelor of Pharmacy',
        level: 'Undergraduate',
        fieldCategory: 'Nursing & Health',
        institutionSlug: 'curtin-university',
        countrySlug: 'australia',
        source: 'Client testimonial — Lim Nary, student at Curtin University'
    },
    {
        slug: 'advanced-diploma-of-engineering-electrical',
        name: 'Advanced Diploma of Engineering – Electrical',
        level: 'Diploma/Certificate',
        fieldCategory: 'Engineering & Trades',
        institutionSlug: 'tafe-wa',
        countrySlug: 'australia',
        source: 'Client testimonial — Kim Jinsub, student at TAFE WA'
    },
    {
        slug: 'bachelor-of-commerce',
        name: 'Bachelor of Commerce',
        level: 'Undergraduate',
        fieldCategory: 'Business & Commerce',
        institutionSlug: 'university-of-western-australia',
        countrySlug: 'australia',
        source: 'Client testimonial — Sangay, student at University of Western Australia'
    }
];

// Broad, browsable fields of study, each mapped to the institution `category` values that
// realistically offer that kind of program. This is a categorisation of existing data, not a
// claim that every institution listed teaches every named program.
const fieldCategories = [
    {
        slug: 'nursing-and-health',
        name: 'Nursing & Health',
        description: 'Health and nursing pathways, from postgraduate nursing degrees to allied-health diplomas.',
        matchesCategories: ['University', 'Higher Education']
    },
    {
        slug: 'business-and-commerce',
        name: 'Business & Commerce',
        description: 'Business, commerce and management programs at university and higher-education-college level.',
        matchesCategories: ['University', 'Higher Education', 'Pathway College']
    },
    {
        slug: 'engineering-and-trades',
        name: 'Engineering & Trades',
        description: 'Engineering degrees through to hands-on trade diplomas delivered by TAFE and vocational providers.',
        matchesCategories: ['University', 'Vocational / TAFE']
    },
    {
        slug: 'pathway-and-foundation-programs',
        name: 'Pathway & Foundation Programs',
        description: 'Foundation and diploma pathways designed to lead into a partner university’s second year.',
        matchesCategories: ['Pathway College']
    },
    {
        slug: 'vocational-and-tafe-diplomas',
        name: 'Vocational & TAFE Diplomas',
        description: 'Vocational education and training (TAFE/RTO) diplomas and certificates.',
        matchesCategories: ['Vocational / TAFE']
    },
    {
        slug: 'english-language-programs',
        name: 'English Language Programs',
        description: 'English (and, in Canada, French) language programs for students building proficiency before further study.',
        matchesCategories: ['Language School']
    },
    {
        slug: 'creative-and-technology',
        name: 'Creative & Technology',
        description: 'Creative, design and technology diplomas.',
        matchesCategories: ['Higher Education']
    }
];

module.exports = { verifiedPrograms, fieldCategories };

// Destination countries and their partner institutions.
//
// Institution -> country mapping was verified individually (each partner logo was
// visually identified, then cross-checked) rather than assumed from the old, uncategorised
// carousel. A few notes for whoever maintains this next:
//  - "INTO University Partnerships" was on the old homepage carousel but couldn't be
//    confidently tied to one destination country (it mainly partners with UK/US universities),
//    so it's left out of the per-country lists below and kept only in the general
//    "Our Partner Institutions" strip on the homepage.
//  - No South Korea partner institution logo existed in the original site assets, so that
//    page is intentionally honest about "coming soon" rather than inventing a partner list.
//
// 2026 redesign additions (all additive - nothing above this line was removed):
//  - `slug`: stable per-institution identifier for /universities/:slug detail pages.
//  - `website`: each institution's official homepage, verified individually via web search
//    (none of this existed in the original data - there was no source to "reuse"). Left
//    `null` only for entities where a single unambiguous official domain couldn't be
//    confirmed; the university detail page shows "Information unavailable" in that case
//    rather than guessing.
//  - `category`: a coarser grouping of the existing, more specific `type` field, used for
//    the new filter UI (Universities / Pathway Colleges / Vocational & TAFE / Language
//    Schools / Higher Education). `type` itself is untouched.
//  - Country-level `overview`, `whyStudy` and `popularFields`: written only from facts
//    already present elsewhere in this data file (the institution list, its `type` mix,
//    and the real, named programs mentioned in data/testimonials.js). No tuition, cost of
//    living, ranking or admissions figures are included anywhere here because none exist in
//    the source data - the templates render "Information unavailable" for those instead of
//    inventing numbers.
module.exports = {
    australia: {
        name: 'Australia',
        flag: 'flag-australia.webp',
        tagline: 'Our longest-running destination, with partner institutions across Western Australia, Queensland, Tasmania and New South Wales.',
        overview: 'Australia is Edu Connections’ longest-running study destination. We partner with institutions across Western Australia, Queensland, Tasmania and New South Wales, spanning public universities, university pathway colleges, vocational (TAFE) providers and higher education colleges.',
        whyStudy: [
            'The widest range of partner institutions we work with — from public universities to vocational (TAFE) colleges and university pathway programs.',
            'English-taught pathway options for students who want a step before direct university entry.',
            'Local, in-person support from our Perth and Brisbane offices throughout your application, visa and enrolment process.',
            'A route to the Temporary Graduate (subclass 485) visa after graduation — ask us about eligibility.'
        ],
        popularFields: ['Nursing & Health', 'Business & Commerce', 'Engineering & Trades', 'Pathway & Foundation Programs'],
        universities: [
            { slug: 'university-of-western-australia', name: 'University of Western Australia (UWA)', logo: 'UWA-logo.jpg', location: 'Perth, WA', type: 'Public university', category: 'University', website: 'https://www.uwa.edu.au/' },
            { slug: 'curtin-university', name: 'Curtin University', logo: 'Curtin-University-logo.jpg', location: 'Perth, WA', type: 'Public university', category: 'University', website: 'https://www.curtin.edu.au/' },
            { slug: 'curtin-college', name: 'Curtin College', logo: 'Curtin-College-logo.jpg', location: 'Perth, WA', type: 'Pathway college to Curtin University', category: 'Pathway College', website: 'https://www.curtincollege.edu.au/' },
            { slug: 'edith-cowan-university', name: 'Edith Cowan University (ECU)', logo: 'ECU-Logo.jpg', location: 'Perth, WA', type: 'Public university', category: 'University', website: 'https://www.ecu.edu.au/' },
            { slug: 'murdoch-college', name: 'Murdoch College', logo: 'Murdoch-College-logo.jpg', location: 'Perth, WA', type: 'Pathway college to Murdoch University', category: 'Pathway College', website: 'https://www.murdochcollege.edu.au/' },
            { slug: 'griffith-college', name: 'Griffith College', logo: 'Griffith-College-logo.jpg', location: 'Brisbane & Gold Coast, QLD', type: 'Pathway college to Griffith University', category: 'Pathway College', website: 'https://www.griffithcollege.edu.au/' },
            { slug: 'uts-college', name: 'UTS College', logo: 'UTS-College-logo.jpg', location: 'Sydney, NSW', type: 'Pathway college to University of Technology Sydney', category: 'Pathway College', website: 'https://utscollege.edu.au/' },
            { slug: 'kaplan-business-school', name: 'Kaplan Business School', logo: 'Kaplan-logo.jpg', location: 'Multiple campuses', type: 'Higher education provider', category: 'Higher Education', website: 'https://www.kbs.edu.au/' },
            { slug: 'navitas', name: 'Navitas', logo: 'Navitas-logo.jpg', location: 'Multiple campuses', type: 'Pathway & higher education provider', category: 'Higher Education', website: 'https://www.navitas.com/' },
            { slug: 'ihm-institute-of-health-and-management', name: 'IHM – Institute of Health and Management', logo: 'IHM-Logo.jpg', location: 'Melbourne, VIC', type: 'Higher education college', category: 'Higher Education', website: 'https://ihm.edu.au/' },
            { slug: 'skills-australia-institute', name: 'Skills Australia Institute (SAI)', logo: 'SAI-logo.jpg', location: 'Perth (Cannington), WA & Adelaide, SA', type: 'Vocational education (RTO)', category: 'Vocational / TAFE', website: 'https://www.skillsaustralia.edu.au/' },
            { slug: 'greenwich-college', name: 'Greenwich College', logo: 'Greenwich-College-logo.jpg', location: 'Sydney, NSW', type: 'English language & vocational college', category: 'Language School', website: 'https://www.greenwichcollege.edu.au/' },
            { slug: 'tafe-wa', name: 'TAFE WA', logo: 'TAFE-WA-logo.jpg', location: 'Western Australia', type: 'Vocational education (TAFE)', category: 'Vocational / TAFE', website: 'https://www.tafe.wa.edu.au/' },
            { slug: 'tafe-tasmania', name: 'TAFE Tasmania', logo: 'TAFE-TAS-logo.jpg', location: 'Tasmania', type: 'Vocational education (TAFE)', category: 'Vocational / TAFE', website: 'https://www.tastafe.tas.edu.au/' }
        ]
    },
    'new-zealand': {
        name: 'New Zealand',
        flag: 'flag-new-zealand.webp',
        tagline: 'A growing destination for students who want an English-speaking education close to Australia.',
        overview: 'A growing destination for students who want an English-speaking education close to Australia. We currently partner with two institutions across Auckland, Wellington and Christchurch.',
        whyStudy: [
            'English language and foundation study options through Auckland Institute of Studies.',
            'Creative and technology diplomas through Yoobee College’s campuses in Auckland, Wellington and Christchurch.',
            'A geographically close alternative to Australia if you’re weighing both destinations.'
        ],
        popularFields: ['English Language & Foundation Studies', 'Creative & Technology Diplomas'],
        universities: [
            { slug: 'auckland-institute-of-studies', name: 'Auckland Institute of Studies (AIS)', logo: 'AIS-logo.jpg', location: 'Auckland', type: 'Private tertiary institute', category: 'Higher Education', website: 'https://www.ais.ac.nz/' },
            { slug: 'yoobee-college', name: 'Yoobee College', logo: 'Yoobee-College-logo.jpg', location: 'Auckland, Wellington & Christchurch', type: 'Creative & technology college', category: 'Higher Education', website: 'https://www.yoobee.ac.nz/' }
        ]
    },
    canada: {
        name: 'Canada',
        flag: 'flag-canada.webp',
        tagline: 'Language and vocational pathways with campuses across Ontario and beyond.',
        overview: 'Language and vocational pathways with campuses across Ontario and beyond, delivered through our partners ILSC Education Group and CIMT College.',
        whyStudy: [
            'English and French language programs through ILSC’s Vancouver and Toronto campuses.',
            'Vocational diplomas in business and technology fields through CIMT College in the Greater Toronto Area.',
            'A pathway option for building English proficiency before further study elsewhere.'
        ],
        popularFields: ['English & French Language Programs', 'Business & Vocational Diplomas'],
        universities: [
            { slug: 'ilsc-education-group', name: 'ILSC Education Group', logo: 'ILSC-logo.jpg', location: 'Vancouver & Toronto', type: 'Language school group', category: 'Language School', website: 'https://ilsceducation.com/' },
            { slug: 'cimt-college', name: 'CIMT College', logo: 'CIMT-logo.jpg', location: 'Greater Toronto Area, ON', type: 'Vocational college', category: 'Vocational / TAFE', website: 'https://www.cimtcollege.com/' }
        ]
    },
    'south-korea': {
        name: 'South Korea',
        flag: 'flag-south-korea.webp',
        tagline: 'We work closely with the Korean student community — our partner institution list for study-in-Korea programs is being finalised.',
        overview: 'We work closely with the Korean student community — our partner institution list for study-in-Korea programs is being finalised.',
        whyStudy: [],
        popularFields: [],
        universities: []
    }
};

const CSS_FILES = [
	"src/styles/base.css",
	"src/styles/main.css",
	"src/styles/list.css",
	"src/styles/article.css",
];

const NOW = new Date();
const THIRTY_DAYS_IN_MINUTES = 30 * 24 * 60;
const BASE_URL = "https://a-believable-fiction.netlify.app";

function formatRfc822(date) {
	const options = {
		weekday: "short", // "Wed"
		day: "2-digit", // "02"
		month: "short", // "Oct"
		year: "numeric", // "2002"
		hour: "2-digit", // "08"
		minute: "2-digit", // "00"
		second: "2-digit", // "00"
		timeZoneName: "shortOffset", // "+0200" or equivalent for specific timezones
		hour12: false, // Use 24-hour format
		timeZone: "GMT",
	};

	const formatter = new Intl.DateTimeFormat("en-GB", options);
	const formattedDate = formatter.format(date);

	const parts = formattedDate.replace(/,/g, "").split(" ");
    const [day, ...rest] = parts;
    return day + ", " + rest.join(" ");
}



export default function (eleventyConfig) {
	// setup global variables
	eleventyConfig.addGlobalData("now", {
		iso: NOW.toISOString(),
		rfc822: formatRfc822(NOW),
	});

	// setup RSS feed specific variables
	eleventyConfig.addGlobalData("feed", {
		ttl: THIRTY_DAYS_IN_MINUTES,
		base: BASE_URL,
	});

	// setup build folders
	eleventyConfig.setIncludesDirectory("templates");

	// get main content from here
	eleventyConfig.setInputDirectory("src");
	eleventyConfig.setOutputDirectory("build");

	// copy over styles
	for (let stylesheet of CSS_FILES) {
		eleventyConfig.addPassthroughCopy(stylesheet);
	}

	// copy over assets (images and the like)
	eleventyConfig.addPassthroughCopy("assets")
}

/// <reference types="node" />

import { readFileSync, writeFileSync } from "node:fs";
import matter from "@11ty/gray-matter";

function printUsage() {
	console.log("USAGE: node publish.js --file <path-to-file>");
}

const argv = process.argv;
const args = {};
for (let i = 0; i < argv.length; i++) {
	if (argv[i] == "--file") {
		i++;
		args.target = argv[i];
	}
	if (argv[i] == "--date" || argv[i] == "-d") {
		i++;
		args.date = new Date(argv[i]);
	}
	if (argv[i] == "--round-to-hour") {
		args.roundToHour = true;
	}
}

if (!args.target) {
	console.error("[ERROR] no target specified, exiting the program");
	printUsage();
	process.exitCode = 1;
	throw new Error("incorrect use of program");
}

if (!args.date) {
	console.warn("[WARN] no date specified will default to current");
	args.date = new Date();
}

if (args.roundToHour) {
	console.info("[INFO] will round to nearest hour");
}

const fileContent = readFileSync(args.target, { encoding: "utf8" });
const { data, content } = matter(fileContent);

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

let targetPublishDate = args.date;
if (args.roundToHour) {
	targetPublishDate.setMinutes(0);
	targetPublishDate.setSeconds(0);
	targetPublishDate.setMilliseconds(0);
}

const rfc822Date = formatRfc822(targetPublishDate);
const isoDate = targetPublishDate.toISOString();

data.published = rfc822Date;
data.publishedISO = isoDate;
data.draft = false;

const post = matter.stringify(content, data);
writeFileSync(args.target, post);

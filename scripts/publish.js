/// <reference types="node" />

import { readFileSync, writeFileSync } from "node:fs";
import matter from "@11ty/gray-matter";

function printUsage() {
	console.log("USAGE: node publish.js --file <path-to-file>");
}

class ArgumentError extends Error {
	constructor(msg) {
		super(msg);
	}
}

/**
 * Parses arguments
 * @param {string[]} argv
 * @returns {{ target: string, date: Date, roundToHour: boolean }} parsed arguments
 */
function parseArgs(argv) {
	const args = {
		roundToHour: false,
	};
	const argc = argv.length;
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === "--file") {
			i++;
			if (i > argc) {
				throw new ArgumentError("[ERROR] argument given but not specified: 'file'");
			}
			args.target = argv[i];
		}
		if (argv[i] === "--date" || argv[i] === "-d") {
			i++;
			if (i > argc) {
				throw new ArgumentError("[ERROR] argument given but not specified: 'date'");
			}
			try {
				args.date = new Date(argv[i]);
			} catch (err) {
				throw new ArgumentError("[ERROR] invalid date");
			}
		}
		if (argv[i] === "--round-to-hour") {
			args.roundToHour = true;
		}
	}

	if (!args.target) {
		throw new ArgumentError("[ERROR] target not specified");
	}

	if (!args.date) {
		console.warn("[WARN] no date specified will default to current");
		args.date = new Date();
	}

	if (args.roundToHour) {
		console.info("[INFO] will round to nearest hour");
	}

	return args;
}

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

function publish(originalMetadata, publishDate) {
	const rfc822Date = formatRfc822(publishDate);
	// somehow putting this directly causes it to get ISO stringified
	// but using something like the toISOString() function causes it to have quotes around it
	const isoDate = publishDate;
	return {
		...originalMetadata,
		draft: false,
		published: rfc822Date,
		publishedISO: isoDate,
	};
}

function main() {
	const argv = process.argv;
	let parsedArgs;
	try {
		parsedArgs = parseArgs(argv);
	} catch (err) {
		if (err instanceof ArgumentError) {
			console.error(err.message);
			printUsage();
			return 1;
		}
		// rethrow unexpected errors
		throw err;
	}

	let data, content;
	try {
		const fileContent = readFileSync(parsedArgs.target, { encoding: "utf8" });
		const fileMatter = matter(fileContent);
		data = fileMatter.data;
		content = fileMatter.content;
	} catch (err) {
		console.error(`[ERROR] unable to read file at ${parsedArgs.target}`);
		return 1;
	}

	let targetPublishDate = parsedArgs.date;
	if (parsedArgs.roundToHour) {
		targetPublishDate.setMinutes(0);
		targetPublishDate.setSeconds(0);
		targetPublishDate.setMilliseconds(0);
	}

	try {
		const publishedData = publish(data, targetPublishDate);
		const post = matter.stringify(content, publishedData);
		writeFileSync(parsedArgs.target, post);
	} catch (err) {
		console.error("[ERROR] unable to write to file");
		return 1;
	}
	return 0;
}

process.exitCode = main();

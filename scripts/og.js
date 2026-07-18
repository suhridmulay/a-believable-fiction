/// <reference types="node" />


/**
 * This script adds opengraph metadata to the provided paths
 */

import { createWriteStream, readFileSync, writeFileSync } from "node:fs";
import markdownit from 'markdown-it';
import matter from "@11ty/gray-matter";
import { createCanvas } from 'canvas';
import { basename, extname } from "node:path";

function parseArgs(argv) {
    let args = {
        paths: []
    };
    let isProcessingPaths = false;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--paths') {
            isProcessingPaths = true;
            continue;
        }
        if (isProcessingPaths) {
            args.paths.push(arg);
        }
    }
    return args;
}

const markdownParser = markdownit({ html: true });
const markdownItRenderer = markdownParser.renderer

function extractFrontmatterAndContent(fullFileContent) {
    const collection = matter(fullFileContent);
    const data = collection.data;
    const content = collection.content;
    return {
        frontMatter: data,
        textContent: content
    }
}

function extractFirstParagraphContent(content) {
    const parsedMarkdownTokens = markdownParser.parse(content);

    let firstParagraph = "";

    for (let i = 0; i < parsedMarkdownTokens.length &&  !firstParagraph; i++) {
        let currentToken = parsedMarkdownTokens[i];
        if (currentToken.type === "paragraph_open") {
            const paragraphContentToken = parsedMarkdownTokens[i + 1];
            if (paragraphContentToken) {
                firstParagraph = paragraphContentToken.content;
            }
        }
    }

    return firstParagraph;
}

function extractHeadingFromFrontmatter(content) {
    const parsed = matter(content);
    const data = parsed.data;
    const title = data.title;
    return title;
}

const VOWELS = ["a", "e", "i", "o", "u"];
function generateOpengraphImage(content, path="assets/og/image/image.png") {
    const canvas = createCanvas(200, 200);
    const context = canvas.getContext('2d');
    const ROWS = 10;
    const COLS = 10;
    const CELL_HEIGHT = 200 / COLS;
    const CELL_WIDTH = 200 / ROWS;
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const currentTextIndex = i * ROWS + j;
            const letter = content[currentTextIndex];
            context.fillStyle = VOWELS.includes(letter.toLowerCase()) ? "red" : "blue";
            context.fillRect(i * CELL_WIDTH, j * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
        }
    }
    const outputWriteStream = createWriteStream(path);
    const canvasImageStream = canvas.createPNGStream();
    canvasImageStream.pipe(outputWriteStream);
}

function attachOpengraphMetadata(content, opengraphData) {
    const frontmatter = matter(content);
    let data = frontmatter.data;
    let text = frontmatter.content;
    data.og = {
        title: opengraphData.title,
        description: opengraphData.description,
        image: opengraphData.image
    }
    return matter.stringify(text, data);
}

function printUsage() {
    const executable = process.argv0;
    return `${executable} --paths <space-separated-paths>`
}

function main() {
    const args = parseArgs(process.argv);
    if (!args.paths || args.paths.length === 0) {
        console.error("[ERROR] no paths provided");
        printUsage();
        return 1;
    }

    console.info(`[INFO] will be processing ${args.paths.length} files`);

    for (let path of args.paths) {
        try {
            const fileContent = readFileSync(path, "utf-8");
            console.log("[INFO] read file");
            const { frontMatter, textContent } = extractFrontmatterAndContent(fileContent)
            const heading = frontMatter.title;
            const firstParagraph = extractFirstParagraphContent(textContent)
            const imageFileName = basename(path, extname(path));
            const imageFilePath = 'assets/og/image/' + imageFileName + '.png';
            generateOpengraphImage(textContent, imageFilePath);
            console.log("[INFO] generated opengraph metadata");
            const fileContentWithAddedOpnegraphData = attachOpengraphMetadata(fileContent, { title: heading, description: firstParagraph, image: imageFilePath  });
            writeFileSync(path, fileContentWithAddedOpnegraphData)
            console.log("[INFO] wrote file with metadata")
        } catch (err) {
            console.error(`[ERROR] unable to read file. ${err.message}`);
        }
    }

    return 0;
}

function _start() {
    try {
        return main();
    } catch (err) {
        console.error(err);
        return 1;
    }
}

process.exitCode = _start();

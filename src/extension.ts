// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { parse } from 'node-html-parser';
const axios = require('axios').default;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	if (hasNotShown(context))
		showDailyQuote(context)

	let disposable = vscode.commands.registerCommand('dailyquote.dailyQuote', () => showDailyQuote(context));

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }

function getDate() {
	let today = new Date();
	let dd = String(today.getDate()).padStart(2, '0');
	let mm = String(today.getMonth() + 1).padStart(2, '0');
	let yyyy = today.getFullYear();

	return yyyy + mm + dd
}

const LAST_HEADING_KEY = 'lastHeading'
const LAST_QUOTE_KEY = 'lastQuote'
const LAST_DATE_KEY = 'lastDate'

function hasNotShown(context: vscode.ExtensionContext) {
	let date = +getDate()
	let lastDate = context.globalState.get<number>(LAST_DATE_KEY)
	return lastDate == undefined || lastDate < date
}

function showDailyQuote(context: vscode.ExtensionContext) {
	console.log("Retrieving quote from cache...")
	let heading = context.globalState.get<string>(LAST_HEADING_KEY) || ""
	let quote = context.globalState.get<string>(LAST_QUOTE_KEY) || ""

	const date = getDate()
	if (hasNotShown(context)) {
		console.log("Retrieve new daily quote...")
		axios.get('https://it.wikiquote.org/wiki/Speciale:FeedElemento/qotd/' + date + '000000/it')
			.then(function (response: any) {
				response = parse(response.data)
				heading = response.querySelector('#firstHeading').firstChild.toString()
				quote = strippy(response.querySelector('.mw-parser-output').toString())
				context.globalState.update(LAST_HEADING_KEY, heading)
				context.globalState.update(LAST_QUOTE_KEY, quote)
				console.log("Caching daily quote...")
			})
			.catch(function (error: any) {
				console.log(error);
			})
		console.log("Caching last date...")
		context.globalState.update(LAST_DATE_KEY, date)
	}
	vscode.window.showInformationMessage(quote)
	vscode.window.showInformationMessage(heading)
}

function strippy(html: string) {
	html = html.replace(/<style([\s\S]*?)<\/style>/gi, '');
	html = html.replace(/<script([\s\S]*?)<\/script>/gi, '');
	html = html.replace(/<\/div>/ig, '\n');
	html = html.replace(/<\/li>/ig, '\n');
	html = html.replace(/<li>/ig, '  *  ');
	html = html.replace(/<\/ul>/ig, '\n');
	html = html.replace(/<\/p>/ig, '\n');
	html = html.replace(/<br\s*[\/]?>/gi, "\n");
	html = html.replace(/<[^>]+>/ig, '');
	return html
}
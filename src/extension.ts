import * as vscode from 'vscode';
import { GetFileProvider } from './providers/selector-definition-provider';

export function activate(context: vscode.ExtensionContext) {

	const selectorRegistration = vscode.languages.registerDefinitionProvider(
		{
		  language: 'html',
		  pattern: '**/*.html',
		  scheme: 'file',
		},
		new GetFileProvider(),
	);

	context.subscriptions.push(
		selectorRegistration,
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}

import * as vscode from 'vscode';
import { Location, Position, ProviderResult, TextDocument, Uri } from 'vscode';

export class GetFileProvider implements vscode.DefinitionProvider {

  /*
   * Optimazation + Features:
   * 
   * - Better regex validation, so we dont have to remove the whitespace.
   * - Optimise for dynamic reggex patterns, click targets and files.
   * - Optimise for dynamic position when getting redirected to the file.
   * - Add hover message for clarification (it's now a small box).
  */
  provideDefinition(document: TextDocument, position: Position): ProviderResult<Location> {
    const config = {
      source: '{**/*.html}',
      ignoreSource: '{node_modules/*, dist/*, prod/*, code/*}',
      ignoreText: '<!DOCTYPE html>',
      prefix: "{{>",
      reggex: /{{>(.*?) /,
    };

    const wordRange = document.getWordRangeAtPosition(position, config.reggex);
    const clickedTag = document.getText(wordRange);

    if(clickedTag.includes(config.ignoreText)) { return null; }
    
    const word = clickedTag.replace(/\s/g, "").split(config.prefix);

    return vscode.workspace.findFiles(config.source, config.ignoreSource)
      .then(files => {
        return files.map(file => {
          return vscode.workspace.openTextDocument(Uri.file(file.fsPath))
            .then(document => {
              const tagMatch = file.fsPath.includes(word[1]);
              
              return {
                path: file.fsPath,
                match: tagMatch,
                lineNumber: 0,
                colNumber: 0,
              };
            });
        });
      })
      .then(files => {
        return Promise.all(files)
          .then(fileObjects => {
            const matched = fileObjects.find((obj => {
                return obj.match;
            }));
            return matched ? matched : null;
          });
      })
      .then(data => {
        if (data === null) {
          return null;
        }
        return new Location(Uri.file(data.path), new Position(data.lineNumber, data.colNumber));
      });
  }
}
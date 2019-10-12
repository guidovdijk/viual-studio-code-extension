import * as vscode from 'vscode';
import { TextDocument, Uri, Position, Location, ProviderResult } from 'vscode';

export class SelectorDefinitionProvider implements vscode.DefinitionProvider {

  /*
   * TODO:
   * Check if clickedTag has the prefix before it '{{>clickedTag', 
   * now if '{{>clickedTag' and 'clickedTag' without the prefix are on the same line
   * both words redirect to the file
   * 
  */
  provideDefinition(document: TextDocument, position: Position): ProviderResult<Location> {
    const wordRange = document.getWordRangeAtPosition(position);
    const clickedTag = document.getText(wordRange);
    const activeEditor = vscode.window.activeTextEditor;

    const config = {
      source: '{**/*.html}',
      prefix: "{{>",
    };

    if (activeEditor) {
      const selection = activeEditor.selection;
      const text = activeEditor.document.lineAt(selection.start.line).text;
      if(text.includes(config.prefix) === false){
        return null;
      }
    }

    return vscode.workspace.findFiles(config.source, 'node_modules/*')
      .then(tsFiles => {
        return tsFiles.map(file => {
          return vscode.workspace.openTextDocument(Uri.file(file.fsPath))
            .then(document => {
              const tagMatch = file.fsPath.includes(clickedTag);
              const lineNumber = 0;
              const colNumber = 0;
              
              return {
                path: file.fsPath,
                match: tagMatch,
                lineNumber,
                colNumber,
              };
            });
        });
      })
      .then(mappedTsFiles => {
        return Promise.all(mappedTsFiles)
          .then(tsFileObjects => {
            const matchedTsFileObject = tsFileObjects.find((mo => {
                return mo.match;
            }));
            return matchedTsFileObject ? matchedTsFileObject : null;
          });
      })
      .then(tagDefinitionPath => {
        if (tagDefinitionPath === null) {
          // Returning null prevents the tag from being underlined, which makes sense as there's no tag definition match.
          return null;
        }
        // Returning a location gives VS Code a hint where to jump to when Ctrl/Cmd + click is invoked on the tag.
        return new Location(Uri.file(tagDefinitionPath.path), new Position(tagDefinitionPath.lineNumber, tagDefinitionPath.colNumber));
      });
  }
}
import * as vscode from 'vscode';
import { TextDocument, Uri, Position, Location, ProviderResult } from 'vscode';

export class SelectorDefinitionProvider implements vscode.DefinitionProvider {

  provideDefinition(document: TextDocument, position: Position): ProviderResult<Location> {
    const wordRange = document.getWordRangeAtPosition(position);

    const clickedTag = document.getText(wordRange);

    const findTagInDocumentRegex = new RegExp(`{{>${clickedTag}`, 'i');
    // const findInputAttributeInDocumentRegex = new RegExp(`@Input\\(['"]?\\\w*['"]?\\)\\s+${clickedTag}`)
    console.log({position, wordRange,
    clickedTag}, );
    return vscode.workspace.findFiles('{**/*.html}', 'node_modules/*')
      .then(tsFiles => {
        return tsFiles.map(file => {
          return vscode.workspace.openTextDocument(Uri.file(file.fsPath))
            .then(document => {
              const tagMatch = file.fsPath.includes(clickedTag);
              // const attributeMatch = findInputAttributeInDocumentRegex.test(document.getText())
              let lineNumber = 0
              let colNumber = 0
              

              return {
                path: file.fsPath,
                match: tagMatch,// || attributeMatch,
                lineNumber,
                colNumber,
              }
            })
        })
      })
      .then(mappedTsFiles => {
        return Promise.all(mappedTsFiles)
          .then(tsFileObjects => {
            const matchedTsFileObject = tsFileObjects.find((mo => {
                return mo.match;
            }))
            return matchedTsFileObject ? matchedTsFileObject : null
          })
      })
      .then(tagDefinitionPath => {
        if (tagDefinitionPath === null) {
          // Returning null prevents the tag from being underlined, which makes sense as there's no tag definition match.
          return null
        }

        // Returning a location gives VS Code a hint where to jump to when Ctrl/Cmd + click is invoked on the tag.
        return new Location(Uri.file(tagDefinitionPath.path), new Position(tagDefinitionPath.lineNumber, tagDefinitionPath.colNumber))
      })
  }
}
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	var themeHasChanged: boolean = false;
	var isEnabled: boolean = true;

	const lightDecorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: 'rgba(0,0,0,0.05)',
		isWholeLine: true, 
		rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
	});
	
	const darkDecorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: 'rgba(255,255,255,0.05)',
		isWholeLine: true, 
		rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
	});

	function getDecoration(): vscode.TextEditorDecorationType {
		const colorTheme = vscode.window.activeColorTheme;
		if(colorTheme.kind === vscode.ColorThemeKind.Dark || colorTheme.kind === vscode.ColorThemeKind.HighContrast) {
			return darkDecorationType;
		} else {
			return lightDecorationType;
		}
	}

	function clearAllThemes(editor: vscode.TextEditor) {
		editor.setDecorations(lightDecorationType, []);
		editor.setDecorations(darkDecorationType, []);
	}

	function clearOtherTheme(editor: vscode.TextEditor) {
		// clear any old decorations if the theme changed since the last draw
		if(themeHasChanged) {
			const colorTheme = vscode.window.activeColorTheme;
			if(colorTheme.kind === vscode.ColorThemeKind.Dark || colorTheme.kind === vscode.ColorThemeKind.HighContrast) {
				editor.setDecorations(lightDecorationType, []);
			} else {
				editor.setDecorations(darkDecorationType, []);
			}
			themeHasChanged = false;
		}
	}

	// redraw the lines on a passed editor's visible lines
	function redrawLines(editor: vscode.TextEditor) {
		if(!isEnabled){
			clearAllThemes(editor);
			return;
		}

		clearOtherTheme(editor);

		let startLine = 0;
		let endLine = 0;
		for (let index = 0; index < editor.visibleRanges.length; index++) {
			const element = editor.visibleRanges[index];
			if(element.end.line > endLine){
				endLine = element.end.line;
			}
			if(element.start.line < startLine) {
				startLine = element.start.line;
			}
		}
		endLine = endLine + 2;
		startLine = startLine - 2;
		if(endLine > editor.document.lineCount - 1) {
			endLine = editor.document.lineCount - 1;
		}
		if(startLine < 0) {
			startLine = 0;
		}

		let decorationsArray: vscode.DecorationOptions[] = [];
		for (let line = startLine; line <= endLine; line++) {
			if (line % 2 === 0) {
				let lineHl = editor.document.lineAt(line);
				decorationsArray.push(lineHl);
			}
		}
		editor.setDecorations(getDecoration(), decorationsArray);
	}

	let onChangeDoc = vscode.workspace.onDidChangeTextDocument((_) =>{
		if(vscode.window.activeTextEditor !== undefined) {
			redrawLines(vscode.window.activeTextEditor);
		}
	});
	context.subscriptions.push(onChangeDoc);

	let onScroller = vscode.window.onDidChangeTextEditorVisibleRanges((change: vscode.TextEditorVisibleRangesChangeEvent) => {
		redrawLines(change.textEditor);
	});
	context.subscriptions.push(onScroller);

	let onChangeTheme = vscode.window.onDidChangeActiveColorTheme((theme: vscode.ColorTheme) => {
		themeHasChanged = true;
		if(vscode.window.activeTextEditor !== undefined) {
			clearOtherTheme(vscode.window.activeTextEditor);
		}
	});
	context.subscriptions.push(onChangeTheme);

	let onChangeEditor = vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
		if(editor !== undefined) {
			redrawLines(editor);
		}
	});
	context.subscriptions.push(onChangeEditor);

	vscode.commands.registerCommand("bardoc.enable", () => {
		isEnabled = true;
		if(vscode.window.activeTextEditor !== undefined) {
			redrawLines(vscode.window.activeTextEditor);
		}
	});

	vscode.commands.registerCommand("bardoc.disable", () => {
		isEnabled = false;
		if(vscode.window.activeTextEditor !== undefined) {
			redrawLines(vscode.window.activeTextEditor);
		}
	});
}

export function deactivate() {}
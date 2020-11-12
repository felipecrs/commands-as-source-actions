// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import { start } from "repl";

const COMMAND = "commands-as-source-actions.argbash";

async function executeTask(task: vscode.Task) {
  const execution = await vscode.tasks.executeTask(task);

  return new Promise<void>((resolve) => {
    let disposable = vscode.tasks.onDidEndTask((e) => {
      if (e.execution.task === execution.task) {
        disposable.dispose();
        resolve();
      }
    });
  });
}

async function getTask(taskName: string) {
  return new Promise<vscode.Task[]>((resolve) => {
    vscode.tasks.fetchTasks().then((tasks) => {
      resolve(tasks.filter((task) => task.name === taskName));
    });
  });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "commands-as-source-actions" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND, async (taskName) => {
      // The code you place here will be executed every time your command is executed

      const document = vscode.window.activeTextEditor?.document;
      // if there is no file open, no point into saving it
      if (!document) {
        return;
      }

      const fileName = document.fileName;
      const oldContent = fs.readFileSync(fileName).toString();
      const editorContent = document.getText();

      // save the file temporarily
      fs.writeFileSync(fileName, editorContent);

      // execute the task, this can apply changes on the file
      const task = (await getTask(taskName))[0];
      await executeTask(task);

      // reload current document with the contents of the file
      const newContent = fs.readFileSync(fileName).toString();
      await vscode.window.activeTextEditor?.edit((edit) => {
        const startPosition = document.lineAt(0).range.start;
        const endPosition = document.lineAt(document.lineCount - 1).range.end;
        edit.replace(new vscode.Range(startPosition, endPosition), newContent);
      });

      // restore the file to VSCode's last known state
      fs.writeFileSync(fileName, oldContent);
    })
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      "shellscript",
      new CommandActionProvider(),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.Source],
      }
    )
  );
}

class CommandActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(
    document: vscode.TextDocument
  ): vscode.CodeAction[] | undefined {
    const task = new vscode.CodeAction("Argbash", vscode.CodeActionKind.Source);

    task.isPreferred = true;
    task.command = {
      title: "Argbash",
      command: COMMAND,
      arguments: ["argbash"],
    };

    return [task];
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as execa from "execa";

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

      console.log(`Trying to execute the task: ${taskName}`);

      const task = (await getTask(taskName))[0];
      await executeTask(task);

      vscode.commands.executeCommand(
        "workbench.action.files.saveWithoutFormatting"
      );
      // Display a message box to the user
      vscode.window.showInformationMessage("Done!");
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

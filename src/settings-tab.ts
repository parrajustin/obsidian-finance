import { buyMeACoffee, paypal } from './graphics';
import LedgerPlugin from './main';
import { PluginSettingTab, Setting } from 'obsidian';

export class SettingsTab extends PluginSettingTab {
  private readonly plugin: LedgerPlugin;

  constructor(plugin: LedgerPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  public display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Ledger Plugin - Settings' });

    new Setting(containerEl)
      .setName('Currency Symbol')
      .setDesc('Prefixes all transaction amounts')
      .addText((text) => {
        text.setPlaceholder('$').setValue(this.plugin.settings.currencySymbol);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.currencySymbol = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    new Setting(containerEl)
      .setName('Ledger File')
      .setDesc(
        'Path in the Vault to your Ledger file. NOTE: If you use Obsidian Sync, you must enable "Sync all other types".',
      )
      .addText((text) => {
        text
          .setValue(this.plugin.settings.ledgerFile)
          .setPlaceholder('transactions.ledger');
        text.inputEl.onblur = (e: FocusEvent) => {
          const target = e.target as HTMLInputElement;
          const newValue = target.value;

          if (newValue.endsWith('.ledger')) {
            target.setCustomValidity('');
            this.plugin.settings.ledgerFile = newValue;
            this.plugin.saveData(this.plugin.settings);
          } else {
            target.setCustomValidity('File must end with .ledger');
          }
          target.reportValidity();
        };
      });

    containerEl.createEl('h3', 'Transaction Account Prefixes');

    containerEl.createEl('p', {
      text: "Ledger uses accounts to group expense types. Accounts are grouped into a hierarchy by separating with a colon. For example 'expenses:food:grocery' and 'expenses:food:restaurants",
    });

    new Setting(containerEl)
      .setName('Asset Account Prefix')
      .setDesc(
        'The account prefix used for grouping asset accounts. If you use aliases in your Ledger file, this must be the **unaliased** account prefix. e.g. "Assets" instead of "a"',
      )
      .addText((text) => {
        text.setValue(this.plugin.settings.assetAccountsPrefix);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.assetAccountsPrefix = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    new Setting(containerEl)
      .setName('Expense Account Prefix')
      .setDesc(
        'The account prefix used for grouping expense accounts. If you use aliases in your Ledger file, this must be the **unaliased** account prefix. e.g. "Expenses" instead of "e"',
      )
      .addText((text) => {
        text.setValue(this.plugin.settings.expenseAccountsPrefix);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.expenseAccountsPrefix = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    new Setting(containerEl)
      .setName('Income Account Prefix')
      .setDesc(
        'The account prefix used for grouping income accounts. If you use aliases in your Ledger file, this must be the **unaliased** account prefix. e.g. "Income" instead of "i"',
      )
      .addText((text) => {
        text.setValue(this.plugin.settings.incomeAccountsPrefix);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.incomeAccountsPrefix = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    new Setting(containerEl)
      .setName('Liability Account Prefix')
      .setDesc(
        'The account prefix used for grouping liability accounts. If you use aliases in your Ledger file, this must be the **unaliased** account prefix. e.g. "Liabilities" instead of "l"',
      )
      .addText((text) => {
        text.setValue(this.plugin.settings.liabilityAccountsPrefix);
        text.inputEl.onblur = (e: FocusEvent) => {
          this.plugin.settings.liabilityAccountsPrefix = (
            e.target as HTMLInputElement
          ).value;
          this.plugin.saveData(this.plugin.settings);
        };
      });

    const div = containerEl.createEl('div', {
      cls: 'ledger-donation',
    });

    const donateText = document.createElement('p');
    donateText.appendText(
      'If this plugin adds value for you and you would like to help support ' +
        'continued development, please use the buttons below:',
    );
    div.appendChild(donateText);

    const parser = new DOMParser();

    div.appendChild(
      createDonateButton(
        'https://paypal.me/tgrosinger',
        parser.parseFromString(paypal, 'text/xml').documentElement,
      ),
    );

    div.appendChild(
      createDonateButton(
        'https://www.buymeacoffee.com/tgrosinger',
        parser.parseFromString(buyMeACoffee, 'text/xml').documentElement,
      ),
    );
  }
}

const createDonateButton = (link: string, img: HTMLElement): HTMLElement => {
  const a = document.createElement('a');
  a.setAttribute('href', link);
  a.addClass('ledger-donate-button');
  a.appendChild(img);
  return a;
};

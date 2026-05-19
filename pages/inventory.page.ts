import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class InventoryPage extends BasePage {
  readonly heading: Locator;
  readonly inventoryList: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly sortDropdown: Locator;
  readonly activeOptionLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('[data-test="title"]');
    this.inventoryList = page.locator('[data-test="inventory-list"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.cartLink = page.locator('[data-test="shopping-cart-link"]');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.activeOptionLabel = page.locator('[data-test="active-option"]');
  }

  async getProductCount(): Promise<number> {
    return this.inventoryList.locator('[data-test="inventory-item"]').count();
  }

  async addItemToCart(itemSlug: string): Promise<void> {
    await this.page.locator(`[data-test="add-to-cart-${itemSlug}"]`).click();
  }

  async removeItemFromCart(itemSlug: string): Promise<void> {
    await this.page.locator(`[data-test="remove-${itemSlug}"]`).click();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  async getItemNames(): Promise<string[]> {
    return this.page.locator('[data-test="inventory-item-name"]').allInnerTexts();
  }

  async getActiveSortLabel(): Promise<string> {
    return this.activeOptionLabel.innerText();
  }

  async getSortOptions(): Promise<string[]> {
    return this.sortDropdown.locator('option').allInnerTexts();
  }

  async getItemPrices(): Promise<number[]> {
    const priceTexts = await this.page
      .locator('[data-test="inventory-item-price"]')
      .allInnerTexts();
    return priceTexts.map(p => parseFloat(p.replace('$', '')));
  }

  async navigateToProductDetail(productName: string): Promise<void> {
    await this.page
      .locator('.inventory_item_name')
      .filter({ hasText: productName })
      .click();
  }
}

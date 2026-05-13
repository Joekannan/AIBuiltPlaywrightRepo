import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  readonly cartList: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly cartItems: Locator;

  constructor(page: Page) {
    super(page);
    this.cartList = page.locator('[data-test="cart-list"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.cartItems = page.locator('.cart_item');
  }

  async getCartItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  async removeItem(itemSlug: string): Promise<void> {
    await this.page.locator(`[data-test="remove-${itemSlug}"]`).click();
  }

  async getItemTitles(): Promise<string[]> {
    return this.page.locator('.inventory_item_name').allInnerTexts();
  }
}

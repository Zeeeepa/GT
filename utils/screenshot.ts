/**
 * Screenshot Utility Module
 * 
 * This module provides utilities for consistent screenshot capture across different environments.
 * It implements the screenshot automation methodology with proper timing and state management.
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Options for taking screenshots
 */
export interface ScreenshotOptions {
  /** Wait for network idle before taking screenshot */
  waitForNetworkIdle?: boolean;
  /** Wait for specific timeout before taking screenshot (in ms) */
  waitTimeout?: number;
  /** Wait for specific element to be visible before taking screenshot */
  waitForSelector?: string;
  /** Wait for specific element to be stable (no movement) before taking screenshot */
  waitForStable?: string;
  /** Custom name for the screenshot */
  name?: string;
  /** Whether to mask sensitive information */
  maskSensitiveData?: boolean;
  /** Selectors to mask (e.g., password fields) */
  maskSelectors?: string[];
  /** Whether to take a full page screenshot */
  fullPage?: boolean;
  /** Clip area for the screenshot */
  clip?: { x: number; y: number; width: number; height: number };
}

/**
 * Default screenshot options
 */
const DEFAULT_OPTIONS: ScreenshotOptions = {
  waitForNetworkIdle: true,
  waitTimeout: 1000,
  maskSensitiveData: false,
  fullPage: false,
};

/**
 * Take a screenshot of a page with consistent timing and state management
 * 
 * @param page Playwright page
 * @param options Screenshot options
 * @returns Promise that resolves when the screenshot is taken
 */
export async function takeScreenshot(page: Page, options: ScreenshotOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { 
    waitForNetworkIdle, 
    waitTimeout, 
    waitForSelector, 
    waitForStable,
    name,
    maskSensitiveData,
    maskSelectors,
    fullPage,
    clip
  } = mergedOptions;

  // Wait for network idle if requested
  if (waitForNetworkIdle) {
    await page.waitForLoadState('networkidle');
  }

  // Wait for specific timeout
  if (waitTimeout) {
    await page.waitForTimeout(waitTimeout);
  }

  // Wait for specific element to be visible
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { state: 'visible' });
  }

  // Wait for element to be stable (no movement)
  if (waitForStable) {
    await waitForElementStable(page.locator(waitForStable));
  }

  // Mask sensitive data if requested
  if (maskSensitiveData && maskSelectors && maskSelectors.length > 0) {
    await maskSensitiveElements(page, maskSelectors);
  }

  // Take the screenshot
  const screenshotOptions: any = {
    fullPage: fullPage,
  };

  if (name) {
    screenshotOptions.name = name;
  }

  if (clip) {
    screenshotOptions.clip = clip;
  }

  return expect(page).toHaveScreenshot(screenshotOptions);
}

/**
 * Take a screenshot of a specific component
 * 
 * @param page Playwright page
 * @param selector Selector for the component
 * @param options Screenshot options
 * @returns Promise that resolves when the screenshot is taken
 */
export async function takeComponentScreenshot(page: Page, selector: string, options: ScreenshotOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Wait for the component to be visible
  const component = page.locator(selector);
  await component.waitFor({ state: 'visible' });
  
  // Wait for network idle if requested
  if (mergedOptions.waitForNetworkIdle) {
    await page.waitForLoadState('networkidle');
  }

  // Wait for specific timeout
  if (mergedOptions.waitTimeout) {
    await page.waitForTimeout(mergedOptions.waitTimeout);
  }

  // Wait for element to be stable (no movement)
  await waitForElementStable(component);

  // Mask sensitive data if requested
  if (mergedOptions.maskSensitiveData && mergedOptions.maskSelectors && mergedOptions.maskSelectors.length > 0) {
    await maskSensitiveElements(page, mergedOptions.maskSelectors);
  }

  // Take the screenshot
  const screenshotOptions: any = {};
  if (mergedOptions.name) {
    screenshotOptions.name = mergedOptions.name;
  }

  return expect(component).toHaveScreenshot(screenshotOptions);
}

/**
 * Wait for an element to be stable (no movement)
 * 
 * @param element Playwright locator
 * @param timeout Timeout in milliseconds
 * @returns Promise that resolves when the element is stable
 */
export async function waitForElementStable(element: Locator, timeout: number = 2000) {
  const startTime = Date.now();
  let lastRect: { x: number; y: number; width: number; height: number } | null = null;
  
  while (Date.now() - startTime < timeout) {
    const boundingBox = await element.boundingBox();
    
    if (!boundingBox) {
      await element.page().waitForTimeout(100);
      continue;
    }
    
    const currentRect = {
      x: Math.round(boundingBox.x),
      y: Math.round(boundingBox.y),
      width: Math.round(boundingBox.width),
      height: Math.round(boundingBox.height)
    };
    
    if (lastRect && 
        currentRect.x === lastRect.x && 
        currentRect.y === lastRect.y && 
        currentRect.width === lastRect.width && 
        currentRect.height === lastRect.height) {
      // Element is stable
      return;
    }
    
    lastRect = currentRect;
    await element.page().waitForTimeout(100);
  }
  
  // If we get here, the element is still moving but we've hit the timeout
  console.warn('Element is still moving after timeout');
}

/**
 * Mask sensitive elements in the page
 * 
 * @param page Playwright page
 * @param selectors Selectors to mask
 * @returns Promise that resolves when elements are masked
 */
export async function maskSensitiveElements(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    const elements = await page.$$(selector);
    for (const element of elements) {
      await page.evaluate((el) => {
        const originalBg = el.style.backgroundColor;
        const originalColor = el.style.color;
        
        el.style.backgroundColor = '#888';
        el.style.color = '#888';
        
        // Store original values as data attributes
        el.dataset.originalBg = originalBg;
        el.dataset.originalColor = originalColor;
      }, element);
    }
  }
}

/**
 * Unmask previously masked elements
 * 
 * @param page Playwright page
 * @param selectors Selectors to unmask
 * @returns Promise that resolves when elements are unmasked
 */
export async function unmaskSensitiveElements(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    const elements = await page.$$(selector);
    for (const element of elements) {
      await page.evaluate((el) => {
        if (el.dataset.originalBg) {
          el.style.backgroundColor = el.dataset.originalBg;
        }
        if (el.dataset.originalColor) {
          el.style.color = el.dataset.originalColor;
        }
      }, element);
    }
  }
}

/**
 * Prepare the page for consistent screenshots
 * 
 * @param page Playwright page
 * @returns Promise that resolves when the page is prepared
 */
export async function preparePageForScreenshots(page: Page) {
  // Disable animations
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
        animation-delay: 0s !important;
        transition-delay: 0s !important;
        animation-iteration-count: 1 !important;
      }
    `
  });

  // Ensure consistent font rendering
  await page.addStyleTag({
    content: `
      * {
        font-family: Arial, sans-serif !important;
        -webkit-font-smoothing: antialiased;
        text-rendering: geometricPrecision;
      }
    `
  });

  // Ensure consistent colors (if needed for testing)
  await page.evaluate(() => {
    // Force color scheme to light to avoid dark mode differences
    document.documentElement.style.colorScheme = 'light';
  });

  // Wait for fonts to load
  await page.waitForFunction(() => document.fonts.ready);
}


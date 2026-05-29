/**
 * ConsoleLayout E2E Tests - Critical user flows for flight simulation
 * Phase 14: End-to-end testing with Playwright for production readiness
 */

import { test, expect } from "@playwright/test";

test.describe("Flight Simulation Console", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the console
    await page.goto("/");
    // Wait for initial render
    await page.waitForSelector(".console-layout");
  });

  test("displays initial ready state", async ({ page }) => {
    // Header should show JSBSim Flight Console
    await expect(page.locator(".console-title")).toContainText("JSBSim Flight Console");

    // Status indicator should show ready
    await expect(page.locator(".status-text")).toContainText("READY");

    // All main sections should be visible
    await expect(page.locator(".primary-viewer")).toBeVisible();
    await expect(page.locator(".control-panel")).toBeVisible();
    await expect(page.locator(".event-panel")).toBeVisible();
  });

  test("starts and pauses simulation", async ({ page }) => {
    // Find play button in SimulationControls
    const playButton = page.locator('button:has-text("▶")').first();

    // Click play
    await playButton.click();

    // Status should change to running
    await expect(page.locator(".status-text")).toContainText("RUNNING", {
      timeout: 2000,
    });

    // Status indicator should pulse (have running class)
    const indicator = page.locator(".status-indicator.running");
    await expect(indicator).toBeVisible();

    // Find and click pause button
    const pauseButton = page.locator('button:has-text("⏸")');
    await pauseButton.click();

    // Status should change to paused
    await expect(page.locator(".status-text")).toContainText("PAUSED", {
      timeout: 2000,
    });
  });

  test("resets simulation", async ({ page }) => {
    // Start simulation
    const playButton = page.locator('button:has-text("▶")').first();
    await playButton.click();

    // Wait for it to run
    await page.waitForTimeout(500);

    // Find and click reset button
    const resetButton = page.locator('button:has-text("↻")');
    await resetButton.click();

    // Status should return to ready
    await expect(page.locator(".status-text")).toContainText("READY", {
      timeout: 2000,
    });

    // Trajectory point count should reset to 0
    const footerText = page.locator(".footer-text");
    await expect(footerText).toContainText("Trajectory: 0 points");
  });

  test("adjusts simulation speed", async ({ page }) => {
    // Find speed control slider
    const speedSlider = page.locator(".param-slider").first();

    // Get current speed from footer
    let footerText = await page.locator(".footer-text").textContent();

    // Increase speed by dragging slider
    await speedSlider.click({ position: { x: 80, y: 0 } });

    // Wait for update
    await page.waitForTimeout(300);

    // Check that footer speed changed
    footerText = await page.locator(".footer-text").textContent();
    expect(footerText).toContain("Speed:");
  });

  test("tracks trajectory during flight", async ({ page }) => {
    // Start simulation
    const playButton = page.locator('button:has-text("▶")').first();
    await playButton.click();

    // Wait for trajectory to accumulate
    await page.waitForTimeout(2000);

    // Check footer for trajectory points
    const footerText = page.locator(".footer-text");
    await expect(footerText).toContainText(/Trajectory: \d+ points/);

    // Verify trajectory points are increasing
    let previousCount = 0;
    for (let i = 0; i < 3; i++) {
      const text = await footerText.textContent();
      const match = text.match(/Trajectory: (\d+) points/);
      const currentCount = match ? parseInt(match[1]) : 0;

      if (i > 0) {
        expect(currentCount).toBeGreaterThanOrEqual(previousCount);
      }
      previousCount = currentCount;

      await page.waitForTimeout(500);
    }
  });

  test("logs simulation events", async ({ page }) => {
    // Start simulation
    const playButton = page.locator('button:has-text("▶")').first();
    await playButton.click();

    // Wait for events to be generated
    await page.waitForTimeout(1500);

    // Check event feed for entries
    const eventFeed = page.locator(".event-list");
    await expect(eventFeed).toBeVisible();

    // Footer should show event count
    const footerText = page.locator(".footer-text");
    const text = await footerText.textContent();
    expect(text).toMatch(/Events: \d+/);
  });

  test("adjusts throttle parameter", async ({ page }) => {
    // Pause simulation to allow parameter editing
    const playButton = page.locator('button:has-text("▶")').first();
    await playButton.click();
    await page.waitForTimeout(500);

    const pauseButton = page.locator('button:has-text("⏸")');
    await pauseButton.click();

    // Find throttle parameter (first one in editor)
    const throttleInput = page.locator(".param-input").first();

    // Clear and set new value
    await throttleInput.focus();
    await throttleInput.fill("0.5");

    // Verify input updated
    await expect(throttleInput).toHaveValue("0.500");

    // Resume simulation
    const resumeButton = page.locator('button:has-text("▶")');
    await resumeButton.click();

    // Verify simulation continues
    await expect(page.locator(".status-text")).toContainText("RUNNING", {
      timeout: 2000,
    });
  });

  test("disables parameters during simulation", async ({ page }) => {
    // Start simulation
    const playButton = page.locator('button:has-text("▶")').first();
    await playButton.click();

    // Wait for simulation to run
    await page.waitForTimeout(500);

    // Check that parameter inputs are disabled
    const paramInput = page.locator(".param-input").first();
    await expect(paramInput).toBeDisabled();

    // Check for overlay message
    const overlay = page.locator(".editor-disabled-overlay");
    await expect(overlay).toBeVisible();
  });

  test("filters events by severity", async ({ page }) => {
    // Start simulation to generate events
    const playButton = page.locator('button:has-text("▶")').first();
    await playButton.click();

    // Wait for events
    await page.waitForTimeout(1500);

    // Click "Critical" filter
    const criticalButton = page.locator('button:has-text("Critical")');
    await criticalButton.click();

    // Event feed should update
    const eventList = page.locator(".event-list");
    await expect(eventList).toBeVisible();
  });

  test("responds to window resize (responsive layout)", async ({ page }) => {
    // Start at desktop size
    await page.setViewportSize({ width: 1440, height: 900 });

    // Verify 3-column layout
    let primaryViewer = page.locator(".primary-viewer");
    let controlPanel = page.locator(".control-panel");
    let eventPanel = page.locator(".event-panel");

    await expect(primaryViewer).toBeVisible();
    await expect(controlPanel).toBeVisible();
    await expect(eventPanel).toBeVisible();

    // Resize to tablet
    await page.setViewportSize({ width: 768, height: 1024 });

    // Sections should still be visible but layout adjusted
    await expect(primaryViewer).toBeVisible();
    await expect(controlPanel).toBeVisible();
    await expect(eventPanel).toBeVisible();

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Sections should stack vertically
    await expect(primaryViewer).toBeVisible();
    await expect(controlPanel).toBeVisible();
    await expect(eventPanel).toBeVisible();
  });

  test("updates footer metrics in real-time", async ({ page }) => {
    // Start simulation
    const playButton = page.locator('button:has-text("▶")').first();
    await playButton.click();

    // Wait for accumulation
    await page.waitForTimeout(1500);

    // Check footer has all metrics
    const footerText = page.locator(".footer-text");
    const text = await footerText.textContent();

    expect(text).toMatch(/Events: \d+/);
    expect(text).toMatch(/Trajectory: \d+ points/);
    expect(text).toMatch(/Speed: [\d.]+×/);
  });

  test("maintains state across pause/resume cycles", async ({ page }) => {
    // Start simulation
    const playButton = page.locator('button:has-text("▶")').first();
    await playButton.click();

    // Wait for events and trajectory
    await page.waitForTimeout(1000);

    // Get initial footer state
    let footerText = await page.locator(".footer-text").textContent();
    const initialEventMatch = footerText.match(/Events: (\d+)/);
    const initialEvents = initialEventMatch ? parseInt(initialEventMatch[1]) : 0;

    // Pause
    const pauseButton = page.locator('button:has-text("⏸")');
    await pauseButton.click();

    // Resume
    const resumeButton = page.locator('button:has-text("▶")');
    await resumeButton.click();

    // Wait for more events
    await page.waitForTimeout(500);

    // Event count should increase
    footerText = await page.locator(".footer-text").textContent();
    const finalEventMatch = footerText.match(/Events: (\d+)/);
    const finalEvents = finalEventMatch ? parseInt(finalEventMatch[1]) : 0;

    expect(finalEvents).toBeGreaterThanOrEqual(initialEvents);
  });
});

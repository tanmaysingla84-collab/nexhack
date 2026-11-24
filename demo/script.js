/**
 * /demo/script.js
 * Interactive Scripted 7-Step Hackathon Demo Runner.
 * Supports Presenter-Paced ("Next" button) and "Auto Mode".
 * Highlights key judging criteria: transparent rejections, live disruptions, and honest pooling metrics.
 */

export class DemoRunner {
  constructor(app) {
    this.app = app;
    this.banner = document.getElementById('demo-banner');
    this.stepPill = document.getElementById('demo-step-pill');
    this.caption = document.getElementById('demo-caption');
    this.btnNext = document.getElementById('btn-demo-next');
    this.btnAuto = document.getElementById('btn-demo-auto');
    this.btnExit = document.getElementById('demo-exit-btn');

    this.currentStep = 0;
    this.isAuto = false;
    this.autoTimer = null;
    this.demoRiderId = null;

    this.steps = [
      {
        title: 'Step 1: Quiet Campus Baseline',
        caption: 'Campus shuttles V1, V2, and V3 circulate between major campus hubs with zero rider load.',
        action: () => this.runStep1()
      },
      {
        title: 'Step 2: Class-Ends Burst & Multi-Rider Pooling',
        caption: 'Simulating classes ending: Multiple students request rides. Watch Shuttle V1 pool Rahul and Priya together into one vehicle!',
        action: () => this.runStep2()
      },
      {
        title: 'Step 3: Unservable Request & Transparent Rejection',
        caption: 'A 4-passenger group request arrives during peak occupancy. The system transparently rejects it, providing full per-vehicle constraint reasons (no silent drops!).',
        action: () => this.runStep3()
      },
      {
        title: 'Step 4: Mid-Trip Cancellation',
        caption: 'A student cancels their waiting request. Watch the vehicle route polyline instantly shrink and remaining ETAs update.',
        action: () => this.runStep4()
      },
      {
        title: 'Step 5: Live Road Closure & Dynamic Rerouting',
        caption: 'A key campus road closes unexpectedly. The vehicle detects the blockage and autonomously reroutes around it.',
        action: () => this.runStep5()
      },
      {
        title: 'Step 6: Shuttle Breakdown Resilience',
        caption: 'Vehicle V2 experiences a mechanical breakdown. The engine safely deboards onboard riders and automatically re-dispatches unpicked rides.',
        action: () => this.runStep6()
      },
      {
        title: 'Step 7: Headless Solo vs Pool Comparison',
        caption: 'Opening the comparison dashboard: Honest data comparing Dynamic Pooling against Solo rides under identical seeded traffic.',
        action: () => this.runStep7()
      }
    ];

    this.init();
  }

  init() {
    if (!this.banner) return;

    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => this.nextStep());
    }

    if (this.btnAuto) {
      this.btnAuto.addEventListener('click', () => this.toggleAuto());
    }

    if (this.btnExit) {
      this.btnExit.addEventListener('click', () => this.stop());
    }

    const startDemoBtn = document.getElementById('btn-start-demo');
    if (startDemoBtn) {
      startDemoBtn.addEventListener('click', () => this.start());
    }
  }

  start() {
    this.currentStep = 0;
    this.isAuto = false;
    if (this.banner) this.banner.style.display = 'flex';
    if (this.btnAuto) this.btnAuto.textContent = '▶ Auto Play';
    this.executeStep(0);
  }

  stop() {
    if (this.autoTimer) clearTimeout(this.autoTimer);
    if (this.banner) this.banner.style.display = 'none';
    this.isAuto = false;
  }

  toggleAuto() {
    this.isAuto = !this.isAuto;
    if (this.btnAuto) {
      this.btnAuto.textContent = this.isAuto ? '⏸ Pause Auto' : '▶ Auto Play';
    }
    if (this.isAuto) {
      this.scheduleAutoNext();
    } else if (this.autoTimer) {
      clearTimeout(this.autoTimer);
    }
  }

  scheduleAutoNext() {
    if (this.autoTimer) clearTimeout(this.autoTimer);
    if (!this.isAuto) return;

    this.autoTimer = setTimeout(() => {
      if (this.currentStep < this.steps.length - 1) {
        this.nextStep();
      } else {
        this.isAuto = false;
        if (this.btnAuto) this.btnAuto.textContent = '▶ Auto Play';
      }
    }, 6000);
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.executeStep(this.currentStep + 1);
    } else {
      this.stop();
    }
  }

  executeStep(stepIndex) {
    this.currentStep = stepIndex;
    const step = this.steps[stepIndex];
    if (!step) return;

    if (this.stepPill) this.stepPill.textContent = `Step ${stepIndex + 1}/${this.steps.length}`;
    if (this.caption) this.caption.innerHTML = step.caption;

    step.action();

    if (this.isAuto) {
      this.scheduleAutoNext();
    }
  }

  // --- Demo Step Implementations ---

  runStep1() {
    // Reset simulation
    this.app.reset(42);
    this.app.setSpeed(1);
    this.app.play();
    this.app.switchTab('requests');
  }

  runStep2() {
    // Step 2: Pool two compatible rides
    this.app.sim.addRequest({
      pickup: 'hostel_a',
      dropoff: 'tech_tower',
      passengers: 1,
      windowMin: 12,
      maxDetourMin: 8
    });

    setTimeout(() => {
      const res = this.app.sim.addRequest({
        pickup: 'library',
        dropoff: 'tech_tower',
        passengers: 1,
        windowMin: 10,
        maxDetourMin: 6
      });
      this.demoRiderId = res.requestId;
    }, 400);
  }

  runStep3() {
    // Step 3: Impossible request (exceeds vehicle capacity)
    this.app.sim.addRequest({
      pickup: 'sports_complex',
      dropoff: 'north_gate',
      passengers: 4,
      windowMin: 5,
      maxDetourMin: 2
    });
    this.app.switchTab('requests');
  }

  runStep4() {
    // Step 4: Mid-trip cancellation of demo rider
    const state = this.app.sim.getState();
    const cancellable = state.requests.find(r => r.status === 'assigned' || r.status === 'waiting');
    if (cancellable) {
      this.app.cancelRequest(cancellable.id);
    }
  }

  runStep5() {
    // Step 5: Close road in use (e.g. e6: library <-> canteen_central)
    this.app.sim.closeRoad('e6');
  }

  runStep6() {
    // Step 6: Break vehicle V2
    this.app.sim.breakVehicle('V2');
  }

  runStep7() {
    // Step 7: Open Comparison Dashboard
    this.app.comparisonDashboard.open();
  }
}

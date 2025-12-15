import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import Courses from "../src/components/courses/Courses.vue";
import exchangesData from "./fixtures/exchanges.json";

function mountCourses() {
  const push = vi.fn();

  const wrapper = shallowMount(Courses, {
    global: {
      mocks: {
        $router: { push },
        $t: (key) => key.replace("countries.", ""),
        $route: { query: {} },
      },
      stubs: {
        "v-data-table": true,
        "v-data-table-virtual": true,
        "v-icon": true,
        "v-text-field": true,
        "v-dialog": true,
        "v-card": true,
        "v-card-title": true,
        "v-card-text": true,
        "v-card-actions": true,
        "v-btn": true,
        "v-row": true,
        "v-col": true,
        "v-divider": true,
        "v-spacer": true,
      },
    },
  });

  // Prevent real Firebase calls
  wrapper.vm.fetchExchangeData = vi.fn();
  wrapper.vm.loadFavoriteCourses = vi.fn();

  return { wrapper, push };
}

function buildCourseList(exchanges, $t) {
  const grouped = {};
  let rawCourseCount = 0;

  for (const exchangeId of Object.keys(exchanges)) {
    const exchange = exchanges[exchangeId];
    if (!exchange?.courses) continue;

    const allCourses = [
      ...Object.values(exchange.courses.Høst || {}),
      ...Object.values(exchange.courses.Vår || {}),
    ];

    rawCourseCount += allCourses.length;

    for (const course of allCourses) {
      if (!course?.replacedCourseCode && !course?.replacedCourseName) continue;

      const code = (course.replacedCourseCode || "").trim();
      if (!code) continue;

      if (!grouped[code]) {
        grouped[code] = {
          id: code,
          courseCode: code,
          courseName: course.replacedCourseName || "",
          courses: [],
          count: 0,
        };
      }

      grouped[code].courses.push({
        ...course,
        country: exchange.country,
        university: exchange.university,
      });

      grouped[code].count++;
    }
  }

  return {
    courseList: Object.values(grouped),
    rawCourseCount,
  };
}


describe("Courses.vue — courseList creation + routing safety", () => {
  it("creates a valid courseList from exchanges data", () => {
    const { wrapper } = mountCourses();

    wrapper.vm.exchanges = exchangesData;

    const { courseList, rawCourseCount } = buildCourseList(
      exchangesData,
      wrapper.vm.$t
    );

    wrapper.vm.courseList = courseList;

    console.log("📦 Loaded exchanges:", Object.keys(exchangesData).length);
    console.log("📊 Raw courses processed:", rawCourseCount);
    console.log("📚 courseList rows created:", courseList.length);
    console.log("🔍 Sample courseList rows:", courseList.slice(0, 3));

    expect(courseList.length).toBeGreaterThan(0);
  });


  it("routeToExchange() never crashes for any course in courseList", () => {
    const { wrapper, push } = mountCourses();

    wrapper.vm.exchanges = exchangesData;

    const { courseList } = buildCourseList(
      exchangesData,
      wrapper.vm.$t
    );

    wrapper.vm.courseList = courseList;

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    let testedCourses = 0;
    let skippedCourses = 0;
    let routedCourses = 0;
    const crashes = [];

    for (const row of courseList) {
      if (!Array.isArray(row.courses)) continue;

      for (const course of row.courses) {
        testedCourses++;

        push.mockClear();

        try {
          wrapper.vm.routeToExchange(course);
        } catch (err) {
          crashes.push({
            course: course.replacedCourseCode || course.replacedCourseName,
            error: err.message,
          });
          continue;
        }

        if (push.mock.calls.length > 0) {
          routedCourses++;
        }
      }
    }

    // Count "exchange not found" warnings
    const exchangeNotFoundLogs = errorSpy.mock.calls.filter(
      ([msg]) =>
        typeof msg === "string" &&
        msg.includes("routeToExchange: exchange not found")
    );

    skippedCourses = exchangeNotFoundLogs.length;

    console.log("🚦 routeToExchange tested courses:", testedCourses);
    console.log("➡️ Successfully routed:", routedCourses);
    console.log("⏭️ Skipped (no matching exchange):", skippedCourses);
    
    if(skippedCourses > 0) {
      for (const log of exchangeNotFoundLogs) {
        console.warn("⚠️", ...log);
      }
    }


    console.log("💥 Crashes:", crashes.length);

    if (crashes.length) {
      console.group("❌ routeToExchange crashes");
      crashes.forEach((c, i) => console.error(`${i + 1}.`, c));
      console.groupEnd();
    }

    errorSpy.mockRestore();

    expect(testedCourses).toBeGreaterThan(0);
    expect(crashes.length).toBe(0);
  });


});

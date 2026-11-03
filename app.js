const defaultTasks = [
  { id: "math-review", title: "مرور درس تابع و حد", subject: "ریاضی", time: "۸:۰۰ · ۴۵ دقیقه", done: true },
  { id: "physics-tests", title: "حل ۱۵ تست حرکت‌شناسی", subject: "فیزیک", time: "۹:۰۰ · ۶۰ دقیقه", done: true },
  { id: "chemistry-study", title: "مطالعه‌ی ساختار اتم", subject: "شیمی", time: "۱۱:۰۰ · ۴۵ دقیقه", done: false },
  { id: "math-tests", title: "تمرین تست‌های علامت‌دار", subject: "ریاضی", time: "۱۴:۰۰ · ۵۰ دقیقه", done: false },
  { id: "review", title: "مرور نکته‌های امروز", subject: "عمومی", time: "۱۶:۰۰ · ۲۰ دقیقه", done: false },
];

const taskKey = "hamghadam.tasks.v1";
let tasks = loadTasks();
let toastTimeout;
let timerInterval = null;
let timerSeconds = 25 * 60;
const initialTimerSeconds = 25 * 60;

const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));

function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(taskKey));
    if (Array.isArray(stored) && stored.every((task) =>
      task && typeof task.id === "string" && typeof task.title === "string" &&
      typeof task.subject === "string" && typeof task.done === "boolean")) return stored;
  } catch (error) {
    console.warn("Saved study tasks could not be loaded.", error);
  }
  return defaultTasks.map((task) => ({ ...task }));
}

function saveTasks() {
  try {
    localStorage.setItem(taskKey, JSON.stringify(tasks));
  } catch (error) {
    showToast("ذخیره‌ی تغییرات ممکن نشد؛ فضای ذخیره‌سازی دستگاه را بررسی کن.");
    console.error("Study tasks could not be saved.", error);
  }
}

function subjectClass(subject) {
  if (subject === "فیزیک") return "physics";
  if (subject === "شیمی") return "chemistry";
  if (subject === "زیست‌شناسی") return "biology";
  return "";
}

function renderTasks() {
  const taskMarkup = tasks.length ? tasks.map((task) => {
    const css = subjectClass(task.subject);
    return `<article class="task-item${task.done ? " completed" : ""}">
      <button class="task-check${task.done ? " done" : ""}" data-toggle-task="${escapeHTML(task.id)}" aria-label="${task.done ? "علامت‌گذاری به‌عنوان انجام‌نشده" : "علامت‌گذاری به‌عنوان انجام‌شده"}" aria-pressed="${task.done}">✓</button>
      <span class="task-subject-dot ${css}" aria-hidden="true"></span>
      <span class="task-copy"><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.subject)}</small></span>
      <span class="task-time">${escapeHTML(task.time || "زمان دلخواه")}</span>
    </article>`;
  }).join("") : '<p class="empty-tasks">فعلاً کاری برای امروز نداری؛ می‌تونی یه قدم تازه اضافه کنی. 🌱</p>';
  document.querySelector("#task-list").innerHTML = taskMarkup;
  document.querySelector("#planner-task-list").innerHTML = tasks.length ? tasks.map((task) => {
    const css = subjectClass(task.subject);
    return `<article class="planner-task${task.done ? " completed" : ""}">
      <span class="task-time">${escapeHTML(task.time || "زمان دلخواه")}</span>
      <button class="task-check${task.done ? " done" : ""}" data-toggle-task="${escapeHTML(task.id)}" aria-label="${task.done ? "علامت‌گذاری به‌عنوان انجام‌نشده" : "علامت‌گذاری به‌عنوان انجام‌شده"}" aria-pressed="${task.done}">✓</button>
      <span class="task-copy"><strong>${escapeHTML(task.title)}</strong><small>${task.done ? "آفرین، این کار رو انجام دادی!" : "آروم پیش برو، عجله‌ای نیست"}</small></span>
      <span class="planner-subject ${css}">${escapeHTML(task.subject)}</span>
    </article>`;
  }).join("") : '<p class="empty-tasks">هنوز کاری برای امروز اضافه نکردی.</p>';
  const done = tasks.filter((task) => task.done).length;
  document.querySelector("#done-count").textContent = toPersianDigits(done);
  document.querySelector("#task-count").textContent = toPersianDigits(tasks.length);
  document.querySelector("#tasks-progress").style.width = `${tasks.length ? (done / tasks.length) * 100 : 0}%`;
  document.querySelector("#report-done").innerHTML = `${toPersianDigits(done)} <small>کار</small>`;
}

function toPersianDigits(value) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2800);
}

function openView(name) {
  const target = document.querySelector(`#view-${name}`);
  if (!target) return;
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view === target));
  document.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === name;
    button.classList.toggle("active", active);
    if (button.classList.contains("nav-item")) {
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    }
  });
  const labels = { dashboard: "داشبورد", planner: "برنامه‌ی من", progress: "گزارش پیشرفت", subjects: "درس‌های من" };
  document.querySelector("#page-label").textContent = labels[name];
  window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function openTaskDialog() {
  const dialog = document.querySelector("#task-dialog");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else showToast("برای اضافه کردن کار، لطفاً مرورگرت رو به‌روز کن.");
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  document.querySelector("#timer-value").textContent = toPersianDigits(
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
  );
  const progress = document.querySelector("#timer-progress");
  const fraction = Math.max(0, timerSeconds / initialTimerSeconds);
  progress.style.strokeDashoffset = String(478 * (1 - fraction));
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = initialTimerSeconds;
  document.querySelector("#timer-toggle").innerHTML = 'شروع تمرکز <span aria-hidden="true">▶</span>';
  document.querySelector("#timer-mode").textContent = "دقیقه‌ی تمرکز";
  updateTimerDisplay();
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) openView(viewButton.dataset.view);
  const viewLink = event.target.closest("[data-view-link]");
  if (viewLink) openView(viewLink.dataset.viewLink);
  const toggleButton = event.target.closest("[data-toggle-task]");
  if (toggleButton) {
    const task = tasks.find((item) => item.id === toggleButton.dataset.toggleTask);
    if (task) {
      task.done = !task.done;
      saveTasks();
      renderTasks();
    }
  }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "add-task") openTaskDialog();
  if (action === "focus") {
    openView("dashboard");
    document.querySelector("#timer-toggle").focus();
    showToast("یه جای آروم پیدا کن و با یه نفس عمیق شروع کن. 💜");
  }
  if (action === "today") showToast("هر روز یه فرصت تازه‌ست. قدم بعدی رو انتخاب کن! 🌱");
});

document.querySelector("#task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  tasks.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: data.get("title").trim(),
    subject: data.get("subject"),
    time: data.get("time").trim() || "زمان دلخواه",
    done: false,
  });
  saveTasks();
  renderTasks();
  document.querySelector("#task-dialog").close();
  form.reset();
  showToast("کار تازه به برنامه‌ات اضافه شد؛ موفق باشی! ✨");
});
document.querySelector(".dialog-close").addEventListener("click", () => document.querySelector("#task-dialog").close());
document.querySelector(".cancel-button").addEventListener("click", () => document.querySelector("#task-dialog").close());

document.querySelector("#timer-toggle").addEventListener("click", (event) => {
  const button = event.currentTarget;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    button.innerHTML = 'ادامه‌ی تمرکز <span aria-hidden="true">▶</span>';
    document.querySelector("#timer-mode").textContent = "مکث کوتاه";
    return;
  }
  if (timerSeconds === 0) timerSeconds = initialTimerSeconds;
  button.innerHTML = 'توقف کوتاه <span aria-hidden="true">Ⅱ</span>';
  document.querySelector("#timer-mode").textContent = "تو از پسش برمیای!";
  timerInterval = setInterval(() => {
    timerSeconds -= 1;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      resetTimer();
      showToast("آفرین! یه جلسه‌ی تمرکز رو کامل کردی. حالا وقت استراحته 🌼");
    }
  }, 1000);
});
document.querySelector("#timer-reset").addEventListener("click", resetTimer);

const persianDayNames = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

function setDates() {
  const now = new Date();
  const faDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long", day: "numeric", month: "long" });
  const fullDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric" });
  document.querySelector("#today-date").textContent = faDate.format(now);
  document.querySelector("#full-date").textContent = fullDate.format(now);
  const iranianWeekday = (now.getDay() + 1) % 7;
  document.querySelector("#weekday-greeting").textContent = persianDayNames[iranianWeekday];
  document.querySelector("#planner-day-title").textContent = `برنامه‌ی ${persianDayNames[iranianWeekday]}`;
  document.querySelector("#week-label").textContent =
    `این هفته · ${new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" }).format(now)}`;
}

function renderWeek() {
  const now = new Date();
  const iranianWeekday = (now.getDay() + 1) % 7;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - iranianWeekday);
  const persianDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric" });
  document.querySelector("#week-strip").innerHTML = persianDayNames.map((name, index) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index);
    return `<button class="day-chip${index === iranianWeekday ? " active" : ""}" aria-pressed="${index === iranianWeekday}"><span>${name}</span><strong>${persianDate.format(date)}</strong></button>`;
  }).join("");
  document.querySelector("#week-strip").addEventListener("click", (event) => {
    const day = event.target.closest(".day-chip");
    if (!day) return;
    document.querySelectorAll(".day-chip").forEach((item) => {
      item.classList.toggle("active", item === day);
      item.setAttribute("aria-pressed", String(item === day));
    });
    showToast(day.getAttribute("aria-pressed") === "true" && day.querySelector("span").textContent === persianDayNames[(new Date().getDay() + 1) % 7]
      ? "برنامه‌ی امروزت رو می‌بینی."
      : "برای این روز برنامه‌ای ثبت نشده؛ می‌تونی به برنامه‌ی امروزت کار اضافه کنی.");
  });
}

renderTasks();
setDates();
renderWeek();
updateTimerDisplay();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.error("Offline support could not be enabled.", error);
    });
  });
}

let installPrompt;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  document.querySelector("#install-button").hidden = false;
});
document.querySelector("#install-button").addEventListener("click", async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  installPrompt = null;
  document.querySelector("#install-button").hidden = true;
});

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const attendanceData = [
  {
    id: generateId(),
    student: "Andi Saputra",
    date: "2024-10-28",
    status: "Hadir",
    note: "Tepat waktu"
  },
  {
    id: generateId(),
    student: "Bella Sasmita",
    date: "2024-10-28",
    status: "Izin (Excused)",
    note: "Mengikuti lomba sains"
  },
  {
    id: generateId(),
    student: "Chandra Wijaya",
    date: "2024-10-28",
    status: "Izin (Unexcused)",
    note: "Tanpa keterangan"
  }
];

const gradeData = [
  {
    id: generateId(),
    student: "Andi Saputra",
    task: "Ulangan Harian Matematika",
    score: 88
  },
  {
    id: generateId(),
    student: "Bella Sasmita",
    task: "Proyek Literasi",
    score: 94
  },
  {
    id: generateId(),
    student: "Chandra Wijaya",
    task: "Presentasi IPS",
    score: 80
  }
];

let attendanceEditingId = null;
let gradeEditingId = null;

const attendanceTableBody = document.querySelector("#attendanceTable tbody");
const gradeTableBody = document.querySelector("#gradeTable tbody");
const attendanceForm = document.querySelector("#attendanceForm");
const gradeForm = document.querySelector("#gradeForm");

const attendanceRateEl = document.querySelector("#attendanceRate");
const excusedCountEl = document.querySelector("#excusedCount");
const unexcusedCountEl = document.querySelector("#unexcusedCount");

const classAverageEl = document.querySelector("#classAverage");
const taskCountEl = document.querySelector("#taskCount");
const topStudentsEl = document.querySelector("#topStudents");
const studentSummaryEl = document.querySelector("#studentSummary");

const exportAttendanceBtn = document.querySelector("#exportAttendance");
const exportGradesBtn = document.querySelector("#exportGrades");
const currentYearEl = document.querySelector("#currentYear");
const attendanceDateInput = document.querySelector("#attendanceDate");

function toStatusClass(status) {
  if (status === "Hadir") return "hadir";
  if (status === "Sakit") return "sakit";
  if (status.includes("Excused")) return "excused";
  if (status.includes("Unexcused")) return "unexcused";
  return "";
}

function renderAttendanceTable() {
  attendanceTableBody.innerHTML = attendanceData
    .map((record) => {
      if (attendanceEditingId === record.id) {
        return `
          <tr data-id="${record.id}">
            <td><input name="student" type="text" value="${record.student}" required></td>
            <td><input name="date" type="date" value="${record.date}" required></td>
            <td>
              <select name="status" required>
                ${["Hadir", "Sakit", "Izin (Excused)", "Izin (Unexcused)"]
                  .map(
                    (status) => `<option value="${status}" ${status === record.status ? "selected" : ""}>${status}</option>`
                  )
                  .join("")}
              </select>
            </td>
            <td><textarea name="note" rows="1" placeholder="Tambahkan keterangan">${record.note ?? ""}</textarea></td>
            <td class="actions-col">
              <button class="table-action save" data-action="save" type="button">Simpan</button>
              <button class="table-action cancel" data-action="cancel" type="button">Batal</button>
            </td>
          </tr>
        `;
      }

      return `
        <tr data-id="${record.id}">
          <td>${record.student}</td>
          <td>${formatDate(record.date)}</td>
          <td><span class="status-pill ${toStatusClass(record.status)}">${record.status}</span></td>
          <td>${record.note ? record.note : "-"}</td>
          <td class="actions-col">
            <button class="table-action edit" data-action="edit" type="button">Edit</button>
            <button class="table-action delete" data-action="delete" type="button">Hapus</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderAttendanceStats() {
  const total = attendanceData.length;
  const hadirCount = attendanceData.filter((item) => item.status === "Hadir").length;
  const excused = attendanceData.filter((item) => item.status.includes("Excused")).length;
  const unexcused = attendanceData.filter((item) => item.status.includes("Unexcused")).length;

  attendanceRateEl.textContent = total ? `${Math.round((hadirCount / total) * 100)}%` : "0%";
  excusedCountEl.textContent = excused;
  unexcusedCountEl.textContent = unexcused;
}

function renderGradeTable() {
  gradeTableBody.innerHTML = gradeData
    .map((record) => {
      if (gradeEditingId === record.id) {
        return `
          <tr data-id="${record.id}">
            <td><input name="student" type="text" value="${record.student}" required></td>
            <td><input name="task" type="text" value="${record.task}" required></td>
            <td><input name="score" type="number" min="0" max="100" value="${record.score}" required></td>
            <td><span class="badge">Bobot Sama</span></td>
            <td class="actions-col">
              <button class="table-action save" data-action="save" type="button">Simpan</button>
              <button class="table-action cancel" data-action="cancel" type="button">Batal</button>
            </td>
          </tr>
        `;
      }

      return `
        <tr data-id="${record.id}">
          <td>${record.student}</td>
          <td>${record.task}</td>
          <td>${record.score}</td>
          <td><span class="badge">Bobot Sama</span></td>
          <td class="actions-col">
            <button class="table-action edit" data-action="edit" type="button">Edit</button>
            <button class="table-action delete" data-action="delete" type="button">Hapus</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderGradeStats() {
  const totalScores = gradeData.reduce((acc, item) => acc + item.score, 0);
  const totalEntries = gradeData.length;
  const average = totalEntries ? (totalScores / totalEntries).toFixed(1) : "0";
  classAverageEl.textContent = average;

  const uniqueTasks = new Set(gradeData.map((item) => item.task));
  taskCountEl.textContent = uniqueTasks.size;

  const summary = gradeData.reduce((acc, item) => {
    if (!acc[item.student]) {
      acc[item.student] = [];
    }
    acc[item.student].push(item.score);
    return acc;
  }, {});

  const averages = Object.entries(summary).map(([student, scores]) => ({
    student,
    average: scores.reduce((acc, score) => acc + score, 0) / scores.length
  }));

  if (!averages.length) {
    topStudentsEl.textContent = "-";
  } else {
    const maxAverage = Math.max(...averages.map((item) => item.average));
    const topStudents = averages
      .filter((item) => Math.abs(item.average - maxAverage) < 0.001)
      .map((item) => item.student);
    topStudentsEl.textContent = topStudents.join(", ");
  }

  studentSummaryEl.innerHTML = averages
    .map(
      (item) => `
        <article class="summary-card">
          <span class="student">${item.student}</span>
          <span class="average">${item.average.toFixed(1)}</span>
          <span class="label">Bobot setiap tugas bernilai sama</span>
        </article>
      `
    )
    .join("");
}

function formatDate(input) {
  if (!input) return "-";
  const date = new Date(input);
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function downloadCsv(data, columns, filename) {
  const headerRow = columns.map((column) => `"${column.label}"`).join(",");
  const csvRows = [headerRow];
  data.forEach((row) => {
    const values = columns.map((column) => {
      const value = row[column.key];
      if (value === undefined || value === null) return "";
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

attendanceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(attendanceForm);
  const student = formData.get("student").trim();
  const date = formData.get("date");
  const status = formData.get("status");
  const note = formData.get("note").trim();

  if (!student || !date || !status) {
    return;
  }

  attendanceData.unshift({
    id: generateId(),
    student,
    date,
    status,
    note
  });

  attendanceForm.reset();
  if (attendanceDateInput) {
    attendanceDateInput.valueAsDate = new Date();
  }

  renderAttendanceTable();
  renderAttendanceStats();
});

attendanceTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const row = button.closest("tr");
  const id = row.dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    attendanceEditingId = id;
    renderAttendanceTable();
    return;
  }

  if (action === "cancel") {
    attendanceEditingId = null;
    renderAttendanceTable();
    return;
  }

  if (action === "save") {
    const student = row.querySelector("input[name='student']").value.trim();
    const date = row.querySelector("input[name='date']").value;
    const status = row.querySelector("select[name='status']").value;
    const note = row.querySelector("textarea[name='note']").value.trim();

    if (!student || !date || !status) {
      alert("Lengkapi data kehadiran sebelum menyimpan.");
      return;
    }

    const target = attendanceData.find((item) => item.id === id);
    if (!target) return;

    Object.assign(target, { student, date, status, note });
    attendanceEditingId = null;
    renderAttendanceTable();
    renderAttendanceStats();
    return;
  }

  if (action === "delete") {
    const confirmed = confirm("Hapus catatan kehadiran ini?");
    if (!confirmed) return;
    const index = attendanceData.findIndex((item) => item.id === id);
    if (index !== -1) {
      attendanceData.splice(index, 1);
      if (attendanceEditingId === id) {
        attendanceEditingId = null;
      }
      renderAttendanceTable();
      renderAttendanceStats();
    }
  }
});

gradeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(gradeForm);
  const student = formData.get("student").trim();
  const task = formData.get("task").trim();
  const score = Number(formData.get("score"));

  if (!student || !task || Number.isNaN(score)) {
    return;
  }

  if (score < 0 || score > 100) {
    alert("Nilai harus berada pada rentang 0-100.");
    return;
  }

  gradeData.unshift({
    id: generateId(),
    student,
    task,
    score
  });

  gradeForm.reset();
  renderGradeTable();
  renderGradeStats();
});

gradeTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const row = button.closest("tr");
  const id = row.dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    gradeEditingId = id;
    renderGradeTable();
    return;
  }

  if (action === "cancel") {
    gradeEditingId = null;
    renderGradeTable();
    return;
  }

  if (action === "save") {
    const student = row.querySelector("input[name='student']").value.trim();
    const task = row.querySelector("input[name='task']").value.trim();
    const score = Number(row.querySelector("input[name='score']").value);

    if (!student || !task || Number.isNaN(score)) {
      alert("Lengkapi nilai sebelum menyimpan.");
      return;
    }

    if (score < 0 || score > 100) {
      alert("Nilai harus berada pada rentang 0-100.");
      return;
    }

    const target = gradeData.find((item) => item.id === id);
    if (!target) return;

    Object.assign(target, { student, task, score });
    gradeEditingId = null;
    renderGradeTable();
    renderGradeStats();
    return;
  }

  if (action === "delete") {
    const confirmed = confirm("Hapus nilai tugas ini?");
    if (!confirmed) return;
    const index = gradeData.findIndex((item) => item.id === id);
    if (index !== -1) {
      gradeData.splice(index, 1);
      if (gradeEditingId === id) {
        gradeEditingId = null;
      }
      renderGradeTable();
      renderGradeStats();
    }
  }
});

exportAttendanceBtn.addEventListener("click", () => {
  downloadCsv(
    attendanceData.map(({ student, date, status, note }) => ({
      student,
      date,
      status,
      note
    })),
    [
      { key: "student", label: "Nama Siswa" },
      { key: "date", label: "Tanggal" },
      { key: "status", label: "Status" },
      { key: "note", label: "Keterangan" }
    ],
    "rekap-kehadiran.csv"
  );
});

exportGradesBtn.addEventListener("click", () => {
  downloadCsv(
    gradeData.map(({ student, task, score }) => ({
      student,
      task,
      score,
      weight: "Setara"
    })),
    [
      { key: "student", label: "Nama Siswa" },
      { key: "task", label: "Tugas" },
      { key: "score", label: "Nilai" },
      { key: "weight", label: "Bobot" }
    ],
    "rekap-nilai.csv"
  );
});

function init() {
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }

  if (attendanceDateInput) {
    attendanceDateInput.valueAsDate = new Date();
  }

  renderAttendanceTable();
  renderAttendanceStats();
  renderGradeTable();
  renderGradeStats();
}

init();

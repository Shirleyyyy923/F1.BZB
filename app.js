const rooms = {
  B1: {
    stage: ["PROJECTOR", "WHITE BOARD"],
    columns: 9,
    rows: [
      [null, "B1", "C1", "D1", null, "E1", "F1", "G1", "H1"],
      ["A1", "B2", "C2", "D2", null, "E2", "F2", "G2", "H2"],
      ["A2", "B3", "C3", "D3", null, "E3", "F3", "G3", "H3"],
      ["A3", "B4", "C4", "D4", null, "E4", "F4", "G4", "H4"],
      ["A4", "B5", "C5", "D5", null, "E5", "F5", "G5", "H5"]
    ],
    taken: [],
    premium: ["B1", "C1", "D1", "E1", "F1", "G1"]
  },
  B3: {
    stage: ["WHITE BOARD"],
    columns: 5,
    rows: Array.from({ length: 8 }, (_, i) => {
      const n = i + 1;
      return [`A${n}`, `B${n}`, null, `C${n}`, `D${n}`];
    }),
    taken: [],
    premium: ["A1", "B1", "C1", "D1", "A2", "B2", "C2", "D2"]
  },
  B5: {
    stage: ["WHITE BOARD", "WHITE BOARD"],
    columns: 12,
    rows: [
      ["A1", "B1", null, "C1", "D1", "E1", "F1", "G1", null, "H1", "I1", "J1"],
      ["A2", "B2", null, "C2", "D2", "E2", "F2", "G2", null, "H2", "I2", "J2"],
      ["A3", "B3", null, "C3", "D3", "E3", "F3", "G3", null, "H3", "I3", "J3"],
      ["A4", "B4", null, "C4", "D4", "E4", "F4", "G4", null, "H4", "I4", "J4"],
      [null, null, null, null, null, null, "F5", "G5", null, "H5", "I5", "J5"],
      [null, null, null, null, null, null, "F6", "G6", null, "H6", "I6", "J6"],
      [null, null, null, null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, "F7", "G7", null, "H7", "I7", "J7"],
      [null, null, null, null, null, null, "F8", "G8", null, "H8", "I8", "J8"]
    ],
    taken: [],
    premium: ["C1", "D1", "E1", "F1", "G1", "H1", "I1", "D2", "E2", "F2", "G2", "H2"]
  },
  B6: {
    stage: ["WHITE BOARD", "WHITE BOARD"],
    columns: 11,
    rows: Array.from({ length: 6 }, (_, i) => {
      const n = i + 1;
      return [`A${n}`, `B${n}`, `C${n}`, null, `D${n}`, `E${n}`, `F${n}`, null, `G${n}`, `H${n}`, `I${n}`];
    }),
    taken: [],
    premium: ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1", "D2", "E2", "F2"]
  }
};

const roomTabs = document.querySelector("#roomTabs");
const seatMap = document.querySelector("#seatMap");
const stageRow = document.querySelector("#stageRow");
const roomName = document.querySelector("#roomName");
const capacityLabel = document.querySelector("#room-capacity");
const availableCount = document.querySelector("#availableCount");
const takenCount = document.querySelector("#takenCount");
const soldPercent = document.querySelector("#soldPercent");
const meterFill = document.querySelector("#meterFill");
const selectedSeat = document.querySelector("#selectedSeat");
const bookingHint = document.querySelector("#bookingHint");
const lockButton = document.querySelector("#lockButton");
const countdown = document.querySelector("#countdown");
const tickerTrack = document.querySelector("#tickerTrack");
const toast = document.querySelector("#toast");
const studentName = document.querySelector("#studentName");
const studentPhone = document.querySelector("#studentPhone");
const studentId = document.querySelector("#studentId");
const studentEmail = document.querySelector("#studentEmail");
const ticketPanel = document.querySelector("#ticketPanel");
const ticketId = document.querySelector("#ticketId");
const ticketSeat = document.querySelector("#ticketSeat");
const ticketName = document.querySelector("#ticketName");
const ticketPhone = document.querySelector("#ticketPhone");
const whatsAppLink = document.querySelector("#whatsAppLink");
const qrMark = document.querySelector("#qrMark");
const courseConfig = window.courseConfig || {
  label: "F1",
  bookingPrefix: "F1",
  storageKey: "f1LockedSeats-v1",
  roomKeys: ["B5", "B6"]
};

let activeRoom = courseConfig.roomKeys[0];
let selected = null;
let timer = 9 * 60 + 59;
let fallbackLockedSeats = {};
const storageKey = courseConfig.storageKey;

if (new URLSearchParams(window.location.search).get("reset") === "1") {
  try {
    localStorage.removeItem("bzbLockedSeats");
    localStorage.removeItem("bzbLockedSeats-v2");
    localStorage.removeItem("bzbLockedSeats-v3");
    localStorage.removeItem("bzbLockedSeats-v4");
    localStorage.removeItem("form1LockedSeats-v1");
    localStorage.removeItem(storageKey);
  } catch {
    fallbackLockedSeats = {};
  }
}

function allSeats(room) {
  return room.rows.flat().filter(Boolean);
}

function formData() {
  return {
    name: studentName.value.trim(),
    phone: studentPhone.value.trim(),
    id: studentId.value.trim(),
    email: studentEmail.value.trim()
  };
}

function canLockTicket() {
  const data = formData();
  return Boolean(selected && data.name && data.phone);
}

function currentTaken(roomKey) {
  const saved = readLockedSeats();
  return new Set([...(rooms[roomKey].taken || []), ...((saved[roomKey] || []))]);
}

function visibleRoomKeys() {
  return courseConfig.roomKeys.filter((key) => rooms[key]);
}

function saveBooking(booking) {
  const saved = readLockedSeats();
  saved[booking.room] = Array.from(new Set([...(saved[booking.room] || []), booking.seat]));
  saved.bookings = [booking, ...(saved.bookings || [])].slice(0, 20);
  fallbackLockedSeats = saved;
  try {
    localStorage.setItem(storageKey, JSON.stringify(saved));
  } catch {
    return;
  }
}

function readLockedSeats() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    return fallbackLockedSeats;
  }
}

function renderTabs() {
  roomTabs.innerHTML = "";
  visibleRoomKeys().forEach((key) => {
    const total = allSeats(rooms[key]).length;
    const taken = currentTaken(key).size;
    const button = document.createElement("button");
    button.className = `room-tab ${key === activeRoom ? "active" : ""}`;
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", key === activeRoom ? "true" : "false");
    button.innerHTML = `${key}<span>${total - taken}/${total} 可抢</span>`;
    button.addEventListener("click", () => {
      activeRoom = key;
      selected = null;
      render();
      showToast(`已切换到 ${key} 课室`);
    });
    roomTabs.appendChild(button);
  });
}

function renderStage(room) {
  stageRow.innerHTML = "";
  stageRow.style.setProperty("--stage-count", room.stage.length);
  room.stage.forEach((label) => {
    const block = document.createElement("div");
    block.className = "stage";
    block.textContent = label;
    stageRow.appendChild(block);
  });
}

function renderSeats(roomKey) {
  const room = rooms[roomKey];
  const taken = currentTaken(roomKey);
  seatMap.innerHTML = "";
  seatMap.style.setProperty("--cols", room.columns);

  room.rows.forEach((row) => {
    row.forEach((seat) => {
      if (!seat) {
        const aisle = document.createElement("div");
        aisle.className = "aisle";
        seatMap.appendChild(aisle);
        return;
      }

      const button = document.createElement("button");
      const isTaken = taken.has(seat);
      const isPremium = room.premium.includes(seat);
      const isSelected = selected === seat;
      button.type = "button";
      button.className = [
        "seat",
        isTaken ? "taken" : "",
        isPremium && !isTaken ? "premium" : "",
        isSelected ? "selected" : ""
      ].filter(Boolean).join(" ");
      button.textContent = seat;
      button.disabled = isTaken;
      button.setAttribute("aria-label", `${roomKey} ${seat}${isTaken ? " 已锁位" : " 可选择"}`);
      button.addEventListener("click", () => selectSeat(seat));
      seatMap.appendChild(button);
    });
  });
}

function renderStats(roomKey) {
  const room = rooms[roomKey];
  const total = allSeats(room).length;
  const taken = currentTaken(roomKey).size;
  const available = total - taken;
  const percent = Math.round((taken / total) * 100);

  roomName.textContent = roomKey;
  capacityLabel.textContent = `${total} seats`;
  availableCount.textContent = available;
  takenCount.textContent = taken;
  soldPercent.textContent = `${percent}%`;
  meterFill.style.width = `${percent}%`;

  if (selected) {
    selectedSeat.textContent = `${roomKey} · ${selected}`;
    lockButton.disabled = !canLockTicket();
    bookingHint.textContent = canLockTicket()
      ? "资料完成，可以生成电子票给学生。"
      : "再填写学生姓名和 WhatsApp 电话，就可以生成电子票。";
  } else {
    selectedSeat.textContent = "还没选择";
    lockButton.disabled = true;
    bookingHint.textContent = "Counter 老师点击座位后，这里会显示暂选信息。";
  }
}

function selectSeat(seat) {
  selected = seat;
  renderSeats(activeRoom);
  renderStats(activeRoom);
  showToast(`${activeRoom} · ${seat} 已暂选，请尽快确认锁位`);
}

function lockSeat() {
  if (!selected) return;
  if (!canLockTicket()) {
    showToast("请先填写学生姓名和 WhatsApp 电话");
    return;
  }
  const lockedRoom = activeRoom;
  const lockedSeat = selected;
  const booking = createBooking(lockedRoom, lockedSeat);
  saveBooking(booking);
  renderTicket(booking);
  showToast(`已为学生锁定 ${lockedRoom} · ${lockedSeat}，电子票已生成`);
  selected = null;
  render();
  renderTicker();
}

function createBooking(roomKey, seat) {
  const data = formData();
  return {
    bookingId: `${courseConfig.bookingPrefix}-${roomKey}-${seat}-${Date.now().toString(36).toUpperCase().slice(-5)}`,
    course: courseConfig.label,
    room: roomKey,
    seat,
    ...data
  };
}

function renderTicket(booking) {
  ticketId.textContent = booking.bookingId;
  ticketSeat.textContent = `${booking.room} · ${booking.seat}`;
  ticketName.textContent = booking.name;
  ticketPhone.textContent = booking.phone;
  renderQrMark(booking.bookingId);
  whatsAppLink.href = buildWhatsAppLink(booking);
  ticketPanel.hidden = false;
  ticketPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildWhatsAppLink(booking) {
  const message = [
    `Hi ${booking.name}，你的 ${booking.course} 备战班座位已锁定。`,
    "",
    `Booking ID: ${booking.bookingId}`,
    `座位: ${booking.room} ${booking.seat}`,
    `姓名: ${booking.name}`,
    `WhatsApp: ${booking.phone}`,
    booking.id ? `Student ID: ${booking.id}` : "",
    booking.email ? `Email: ${booking.email}` : "",
    "",
    "请保留这张电子票，counter 老师会根据这个座位安排上课。"
  ].filter(Boolean).join("\n");
  const phone = normalizeWhatsAppPhone(booking.phone);
  const path = phone ? `https://wa.me/${phone}` : "https://wa.me/";
  return `${path}?text=${encodeURIComponent(message)}`;
}

function normalizeWhatsAppPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("60")) return digits;
  if (digits.startsWith("0")) return `6${digits}`;
  return digits;
}

function renderQrMark(seed) {
  qrMark.innerHTML = "";
  const bits = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  for (let i = 0; i < 49; i += 1) {
    const cell = document.createElement("span");
    const finder = (i < 16 && i % 7 < 4) || (i < 28 && i % 7 > 4) || (i > 32 && i % 7 < 3);
    if (finder || ((i * 7 + bits) % 5 === 0) || ((i + bits) % 7 === 0)) {
      qrMark.appendChild(cell);
    } else {
      const blank = document.createElement("i");
      qrMark.appendChild(blank);
    }
  }
}

function renderTicker() {
  const bookings = readLockedSeats().bookings || [];
  const items = bookings.length
    ? bookings.map((booking) => {
        const name = booking.name || "学生";
        return `真实记录：${booking.course || courseConfig.label} Counter 已为 ${name} 锁定 ${booking.room}-${booking.seat}`;
      })
    : ["等待 counter 开始锁位 · 目前所有通告都会根据真实电子票记录显示"];
  tickerTrack.innerHTML = [...items, ...items].map((item) => `<span>${item}</span>`).join("");
}

function updateCountdown() {
  const min = String(Math.floor(timer / 60)).padStart(2, "0");
  const sec = String(timer % 60).padStart(2, "0");
  countdown.textContent = `${min}:${sec}`;
  timer = timer > 0 ? timer - 1 : 9 * 60 + 59;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.hideTimer);
  showToast.hideTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function render() {
  renderTabs();
  renderStage(rooms[activeRoom]);
  renderSeats(activeRoom);
  renderStats(activeRoom);
}

lockButton.addEventListener("click", lockSeat);
[studentName, studentPhone, studentId, studentEmail].forEach((input) => {
  input.addEventListener("input", () => renderStats(activeRoom));
});
renderTicker();
render();
updateCountdown();
setInterval(updateCountdown, 1000);

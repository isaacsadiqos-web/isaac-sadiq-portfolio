/* =========================================================
   contact.js — Contact form validation (frontend demonstration)
   Validates every field locally. Nothing is sent to a server.
   ========================================================= */
(function () {
  "use strict";

  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusBox = document.getElementById("form-status");
  const counter = document.getElementById("message-count");
  const MESSAGE_MAX = 1000;

  const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
  const DIGITS_ONLY = /^\d+$/;

  /** Each rule returns an error string, or "" when the value is valid. */
  const rules = {
    name(value) {
      if (!value) return "Please enter your full name.";
      if (value.length < 2) return "Your name must be at least 2 characters long.";
      if (value.length > 80) return "Your name must be 80 characters or fewer.";
      return "";
    },
    email(value) {
      if (!value) return "Please enter your email address.";
      if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address, for example name@example.com.";
      return "";
    },
    phone(value) {
      if (!value) return "Please enter your phone number.";
      if (!DIGITS_ONLY.test(value)) return "Use digits only: no spaces, dashes, brackets or + sign.";
      if (value.length < 7 || value.length > 15) return "A phone number should have between 7 and 15 digits.";
      return "";
    },
    message(value) {
      if (!value) return "Please write a message.";
      if (value.length < 10) return "Your message should be at least 10 characters long.";
      if (value.length > MESSAGE_MAX) return "Your message must be " + MESSAGE_MAX + " characters or fewer.";
      return "";
    }
  };

  const inputs = Object.keys(rules).map((name) => form.elements[name]);

  function validateField(input) {
    const value = input.value.trim();
    const message = rules[input.name](value);
    const field = input.closest(".field");
    const errorEl = document.getElementById(input.id + "-error");

    field.classList.toggle("field--error", Boolean(message));
    field.classList.toggle("field--ok", !message && value.length > 0);
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorEl) errorEl.textContent = message;
    return message === "";
  }

  function clearStatus() {
    statusBox.className = "form-status";
    statusBox.replaceChildren();
  }

  function showStatus(type, title, text, extra) {
    clearStatus();
    statusBox.classList.add("is-visible", "form-status--" + type);
    const strong = document.createElement("strong");
    strong.textContent = title;
    const p = document.createElement("p");
    p.style.margin = "0";
    p.textContent = text;
    statusBox.append(strong, p);
    if (extra) statusBox.appendChild(extra);
    statusBox.focus();
  }

  function buildMailtoLink(values) {
    const subject = "Portfolio message from " + values.name;
    const body = [
      values.message,
      "",
      "---",
      "Name: " + values.name,
      "Email: " + values.email,
      "Phone: " + values.phone
    ].join("\n");

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.9rem";

    [
      { label: "Send via your email app (personal)", address: "sadiqohinoyiisaac@gmail.com", primary: true },
      { label: "Send to academic email", address: "I.sadiq0335@miva.edu.ng", primary: false }
    ].forEach((target) => {
      const a = document.createElement("a");
      a.className = "btn btn--sm " + (target.primary ? "btn--primary" : "btn--ghost");
      a.href = "mailto:" + target.address + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      a.textContent = target.label;
      wrapper.appendChild(a);
    });
    return wrapper;
  }

  /* Live feedback: validate on blur, then re-validate while typing */
  inputs.forEach((input) => {
    input.addEventListener("blur", () => { if (input.value.trim() !== "" || input.dataset.touched) validateField(input); input.dataset.touched = "1"; });
    input.addEventListener("input", () => { if (input.dataset.touched) validateField(input); });
  });

  /* Character counter */
  const messageInput = form.elements.message;
  function updateCounter() {
    counter.textContent = messageInput.value.length + " / " + MESSAGE_MAX;
  }
  messageInput.addEventListener("input", updateCounter);

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // validation must pass before anything happens
    inputs.forEach((i) => { i.dataset.touched = "1"; });

    const results = inputs.map(validateField);
    const firstInvalid = inputs[results.indexOf(false)];

    if (firstInvalid) {
      showStatus("error", "Please fix the highlighted fields.", "Some information is missing or incorrect. Check the messages below each field and try again.");
      firstInvalid.focus();
      return;
    }

    const values = {};
    inputs.forEach((i) => { values[i.name] = i.value.trim(); });

    showStatus(
      "success",
      "Validated successfully. Thank you, " + values.name.split(" ")[0] + "!",
      "This is a demonstration form: your message was checked in your browser but was not delivered to any inbox. To actually reach Isaac, send it through your email app using the buttons below, or use the direct email addresses on this page.",
      buildMailtoLink(values)
    );

    form.reset(); // clears the fields; the status box (with the prepared links) stays visible
  });

  form.addEventListener("reset", () => {
    inputs.forEach((input) => {
      const field = input.closest(".field");
      field.classList.remove("field--error", "field--ok");
      input.setAttribute("aria-invalid", "false");
      delete input.dataset.touched;
      const errorEl = document.getElementById(input.id + "-error");
      if (errorEl) errorEl.textContent = "";
    });
    setTimeout(updateCounter, 0);
  });

  document.getElementById("form-reset").addEventListener("click", clearStatus);
  updateCounter();
})();

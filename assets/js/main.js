/* Serpiente de Google — shared UI: mobile nav, FAQ accordion, footer year, contact form. */
(function () {
  "use strict";

  // mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // FAQ accordion (one open at a time)
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.setAttribute("aria-expanded", "false");
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (other) {
        other.classList.remove("open");
        other.querySelector(".faq-a").style.maxHeight = null;
        other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

  // footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // contact form -> opens the visitor's email client (no backend on a static site)
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#c-nombre").value.trim();
      var email = form.querySelector("#c-email").value.trim();
      var msg = form.querySelector("#c-mensaje").value.trim();
      var note = document.getElementById("form-note");
      if (!name || !email || !msg) {
        note.textContent = "Por favor, completa todos los campos antes de enviar.";
        return;
      }
      var to = "hola@serpientedegoogle.es"; // <-- cambia esto por tu email real
      var subject = encodeURIComponent("Contacto desde Serpiente de Google — " + name);
      var body = encodeURIComponent("Nombre: " + name + "\nEmail: " + email + "\n\n" + msg);
      note.textContent = "Abriendo tu aplicación de correo para enviar el mensaje…";
      window.location.href = "mailto:" + to + "?subject=" + subject + "&body=" + body;
    });
  }
})();

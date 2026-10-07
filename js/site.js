(function () {
  var WA = "27749052088";
  var EMAIL = "abangunihc@gmail.com";
  var STORE = "abanguni-quote";

  function zar(amount) {
    var n = Math.round(Number(amount) || 0);
    return "R" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  qsa("[data-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  var toggle = qs(".nav-toggle");
  var nav = qs("#site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
      toggle.textContent = open ? "Close" : "Menu";
    });
    qsa("a", nav).forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
        toggle.textContent = "Menu";
      });
    });
  }

  var tablist = qs("[data-tabs]");
  if (tablist) {
    var tabs = qsa("[role='tab']", tablist);
    function show(tab) {
      tabs.forEach(function (item) {
        var selected = item === tab;
        item.setAttribute("aria-selected", selected ? "true" : "false");
        item.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(item.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
    }
    tabs.forEach(function (tab, index) {
      tab.tabIndex = index === 0 ? 0 : -1;
      tab.addEventListener("click", function () { show(tab); });
      tab.addEventListener("keydown", function (event) {
        var next = index;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        if (next !== index) {
          event.preventDefault();
          tabs[next].focus();
          show(tabs[next]);
        }
      });
    });
    var hash = window.location.hash.replace("#", "");
    if (hash) {
      var match = tabs.filter(function (tab) {
        return tab.getAttribute("aria-controls") === hash;
      })[0];
      if (match) show(match);
    }
  }

  function bindEstimate(root) {
    if (!root) return;
    var guests = qs("[data-guests]", root);
    var choice = qs("[data-choice]", root);
    var total = qs("[data-total]", root);
    var note = qs("[data-note]", root);
    var send = qs("[data-send-estimate]", root);

    function read() {
      var count = Math.max(0, Number(guests.value) || 0);
      var option = choice.options[choice.selectedIndex];
      var rate = Number(option.value) || 0;
      var name = option.getAttribute("data-name") || option.textContent;
      var sum = count * rate;
      total.textContent = count ? zar(sum) : "R0";
      var extra = "";
      if (root.getAttribute("data-estimate") === "breakfast" && option.getAttribute("data-min") === "20" && count && count < 20) {
        extra = " The R45 and R70 rates are listed for 20 guests or more. Ask us to quote a smaller breakfast.";
      }
      note.textContent = count
        ? count + " guests × " + zar(rate) + " for " + name + "." + extra
        : "Add a guest count to see the total.";
      return { count: count, name: name, rate: rate, sum: sum };
    }

    guests.addEventListener("input", read);
    choice.addEventListener("change", read);
    root.addEventListener("submit", function (event) { event.preventDefault(); });
    read();

    if (send) {
      send.addEventListener("click", function () {
        var data = read();
        if (!data.count) {
          guests.focus();
          return;
        }
        saveDraft({
          event: root.getAttribute("data-event") || "",
          guests: String(data.count),
          package: root.getAttribute("data-package") || "",
          notes: data.count + " guests, " + data.name + " at " + zar(data.rate) + " each. Estimate " + zar(data.sum) + ". Please confirm this menu."
        });
        window.location.href = "contact.html#quote";
      });
    }
  }

  qsa("[data-estimate]").forEach(bindEstimate);

  function saveDraft(partial) {
    sessionStorage.setItem(STORE, JSON.stringify(partial));
  }

  var kids = qs("[data-kids]");
  if (kids) {
    var summary = qs("[data-kids-summary]", kids);
    var boxes = qsa("input[type='checkbox']", kids);

    function kidsState() {
      var groups = {};
      boxes.forEach(function (box) {
        var group = box.getAttribute("data-group");
        if (!groups[group]) groups[group] = [];
        if (box.checked) groups[group].push(box.value);
      });
      var lines = ["Kids party quote request.", "Included if you take the package: stretch tent, jumping castle, tent décor, party pack, birthday cake with a picture.", ""];
      var warnings = [];
      Object.keys(groups).forEach(function (group) {
        var picked = groups[group];
        if (!picked.length) return;
        lines.push(group + ": " + picked.join(", "));
        if (picked.length > 3) warnings.push(group + " has " + picked.length + " items. The published note asks for 3 in each group.");
      });
      var chosen = boxes.some(function (box) { return box.checked; });
      summary.textContent = chosen ? lines.join("\n") : "Tick the dishes you want quoted. Abanguni asked hosts to choose 3 items in each group.";
      qsa("[data-group-note]", kids).forEach(function (node) {
        var group = node.getAttribute("data-group-note");
        var count = groups[group] ? groups[group].length : 0;
        node.textContent = count > 3 ? "That’s more than 3. You can still send it and ask them to adjust." : "";
      });
      return { text: lines.join("\n"), chosen: chosen };
    }

    boxes.forEach(function (box) { box.addEventListener("change", kidsState); });
    kidsState();

    var kidsSend = qs("[data-send-kids]");
    if (kidsSend) {
      kidsSend.addEventListener("click", function () {
        var state = kidsState();
        if (!state.chosen) {
          summary.focus();
          return;
        }
        saveDraft({
          event: "Kids party",
          package: "Kids party",
          notes: state.text
        });
        window.location.href = "contact.html#quote";
      });
    }
  }

  function fillForm(form, data) {
    Object.keys(data).forEach(function (key) {
      if (!data[key]) return;
      var field = form.elements[key];
      if (!field || field.value) return;
      field.value = data[key];
    });
  }

  qsa(".quote-form").forEach(function (form) {
    var params = new URLSearchParams(window.location.search);
    fillForm(form, {
      event: params.get("event") || "",
      guests: params.get("guests") || "",
      package: params.get("package") || "",
      setting: params.get("setting") || ""
    });

    try {
      var saved = sessionStorage.getItem(STORE);
      if (saved) {
        sessionStorage.removeItem(STORE);
        fillForm(form, JSON.parse(saved));
      }
    } catch (err) {
      sessionStorage.removeItem(STORE);
    }

    var ready = qs(".quote-ready", form);
    var output = qs("[data-output]", form);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var valid = true;
      qsa(".field", form).forEach(function (field) {
        var input = qs("input, select, textarea", field);
        var bad = false;
        if (input.required && !String(input.value).trim()) bad = true;
        if (input.type === "email" && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) bad = true;
        if (input.name === "guests" && input.value && Number(input.value) < 1) bad = true;
        field.classList.toggle("is-invalid", bad);
        if (bad) valid = false;
      });
      if (!valid) {
        var first = qs(".is-invalid input, .is-invalid select, .is-invalid textarea", form);
        if (first) first.focus();
        return;
      }

      var data = {
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        email: form.elements.email.value.trim(),
        event: form.elements.event.value,
        date: form.elements.date.value,
        guests: form.elements.guests.value,
        setting: form.elements.setting.value,
        package: form.elements.package.value,
        notes: form.elements.notes.value.trim()
      };

      var lines = [
        "Hello Abanguni, I would like a quote.",
        "",
        "Name: " + data.name,
        "Phone: " + data.phone,
        "Email: " + (data.email || "Not given"),
        "Event: " + data.event,
        "Date: " + (data.date || "Not chosen yet"),
        "Guests: " + (data.guests || "Not sure"),
        "Setting: " + (data.setting || "Not sure"),
        "Interest: " + (data.package || "Not sure")
      ];
      if (data.notes) lines.push("", data.notes);
      var message = lines.join("\n");
      output.value = message;
      ready.hidden = false;

      var wa = qs("[data-wa]", form);
      var mail = qs("[data-mail]", form);
      wa.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(message);
      mail.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Quote enquiry from " + data.name) + "&body=" + encodeURIComponent(message);
      ready.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    var copy = qs("[data-copy]", form);
    if (copy) {
      copy.addEventListener("click", function () {
        var text = output.value;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            copy.textContent = "Copied";
          }).catch(function () {
            output.focus();
            output.select();
          });
        } else {
          output.focus();
          output.select();
        }
      });
    }
  });
})();

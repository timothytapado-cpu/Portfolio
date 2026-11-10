/* Database-backed project and activity manager */
(function () {
  const $ = (id) => document.getElementById(id);
  const form = $("projectForm");
  const grid = $("managedProjectGrid");
  const formStatus = $("projectFormStatus");
  const listStatus = $("projectListStatus");
  const dialog = $("projectDetailsDialog");
  let projects = [];
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  const configuredOrigin = window.PORTFOLIO.config.projectApiUrl.trim().replace(/\/+$/, "");
  const localFrontend = ["localhost", "127.0.0.1"].includes(location.hostname)
    && location.port !== "3000";
  const apiOrigin = configuredOrigin || (localFrontend ? "http://localhost:3000" : "");
  const endpoint = (path = "") => `${apiOrigin}/api/projects${path}`;

  function showMessage(element, message, kind = "") {
    element.textContent = message;
    element.className = `project-message${kind ? ` ${kind}` : ""}`;
  }

  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(endpoint(path), {
        ...options,
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers
        }
      });
    } catch (_) {
      throw new Error("Could not reach the project database. Start the Flask server and try again.");
    }

    let result;
    try {
      result = await response.json();
    } catch (_) {
      throw new Error("The server returned an invalid response.");
    }
    if (!response.ok) throw new Error(result.error || "The request could not be completed.");
    return result;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return Number.isNaN(date.getTime())
      ? "Unknown date"
      : date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function renderProjects(projects) {
    if (!projects.length) {
      grid.innerHTML = "";
      showMessage(listStatus, "No projects or activities yet. Add one using the form above.");
      return;
    }

    showMessage(listStatus, `${projects.length} saved ${projects.length === 1 ? "record" : "records"}.`);
    grid.innerHTML = projects.map((project) => `
      <article class="card managed-project-card">
        <small>${escapeHtml(project.category)}</small>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <p class="project-meta"><strong>Status:</strong> ${escapeHtml(project.status)}<br>
          <strong>Date created:</strong> ${escapeHtml(formatDate(project.dateCreated))}</p>
        <div class="project-actions">
          <button class="btn" type="button" data-action="view" data-id="${project.id}">View</button>
          <button class="btn" type="button" data-action="edit" data-id="${project.id}">Edit</button>
          <button class="btn" type="button" data-action="delete" data-id="${project.id}">Delete</button>
        </div>
      </article>`).join("");
  }

  async function loadProjects() {
    showMessage(listStatus, "Loading saved projects…");
    try {
      const result = await request();
      projects = result.projects;
      renderProjects(projects);
      return projects;
    } catch (error) {
      showMessage(listStatus, error.message, "err");
      return [];
    }
  }

  function resetForm() {
    form.reset();
    $("projectId").value = "";
    $("projectFormTitle").textContent = "Add a project or activity";
    $("projectSubmit").textContent = "Add Project";
    $("projectCancel").hidden = true;
    showMessage(formStatus, "");
  }

  function editProject(project) {
    $("projectId").value = project.id;
    $("projectTitle").value = project.title;
    $("projectDescription").value = project.description;
    $("projectCategory").value = project.category;
    $("projectStatus").value = project.status;
    $("projectFormTitle").textContent = "Edit project or activity";
    $("projectSubmit").textContent = "Save Changes";
    $("projectCancel").hidden = false;
    showMessage(formStatus, "Editing the selected record.");
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    $("projectTitle").focus({ preventScroll: true });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const project = {
      title: $("projectTitle").value.trim(),
      description: $("projectDescription").value.trim(),
      category: $("projectCategory").value,
      status: $("projectStatus").value
    };
    if (!project.title || !project.description) {
      showMessage(formStatus, "Please enter a title and description.", "err");
      return;
    }

    const id = $("projectId").value;
    const submit = $("projectSubmit");
    submit.disabled = true;
    showMessage(formStatus, id ? "Saving changes…" : "Adding project…");
    try {
      await request(id ? `/${encodeURIComponent(id)}` : "", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(project)
      });
      resetForm();
      showMessage(formStatus, id ? "Project updated successfully." : "Project added successfully.", "ok");
      await loadProjects();
    } catch (error) {
      showMessage(formStatus, error.message, "err");
    } finally {
      submit.disabled = false;
    }
  });

  $("projectCancel").addEventListener("click", resetForm);

  grid.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    let project;
    try {
      project = (await request(`/${encodeURIComponent(button.dataset.id)}`)).project;
    } catch (error) {
      showMessage(listStatus, error.message, "err");
      await loadProjects();
      return;
    }

    if (button.dataset.action === "view") {
      $("projectDialogTitle").textContent = project.title;
      $("projectDialogDescription").textContent = project.description;
      $("projectDialogMeta").textContent =
        `${project.category} · ${project.status} · Created ${formatDate(project.dateCreated)}`;
      dialog.showModal();
    } else if (button.dataset.action === "edit") {
      editProject(project);
    } else if (button.dataset.action === "delete") {
      if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
      try {
        await request(`/${encodeURIComponent(project.id)}`, { method: "DELETE" });
        if ($("projectId").value === String(project.id)) resetForm();
        showMessage(formStatus, "Project deleted successfully.", "ok");
        await loadProjects();
      } catch (error) {
        showMessage(listStatus, error.message, "err");
      }
    }
  });

  $("projectDialogClose").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  loadProjects();
})();

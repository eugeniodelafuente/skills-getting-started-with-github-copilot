document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to escape HTML in participant names/emails
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear activity select to avoid duplicate options on re-fetch
      activitySelect.innerHTML = '<option value="">Selecciona una actividad</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML (list with delete buttons or fallback text)
        const participantsListHTML =
          details.participants && details.participants.length > 0
            ? `<ul class="participants-list">
                 ${details.participants
                   .map(
                     (p) => `<li class="participant-item">
                       <span>${escapeHtml(p)}</span>
                       <button 
                         class="delete-participant" 
                         data-activity="${escapeHtml(name)}" 
                         data-email="${escapeHtml(p)}"
                         title="Eliminar participante"
                       >×</button>
                     </li>`
                   )
                   .join("")}
               </ul>`
            : `<p class="no-participants">No hay participantes aún</p>`;

        activityCard.innerHTML = `
          <h4 class="activity-title">${escapeHtml(name)}</h4>
          <p class="activity-desc">${escapeHtml(details.description)}</p>
          <p class="activity-schedule"><strong>Horario:</strong> ${escapeHtml(details.schedule)}</p>
          <p class="activity-availability"><strong>Disponibilidad:</strong> <span class="spots-left">${spotsLeft} plazas</span></p>

          <div class="participants-section">
            <h5 class="participants-heading">Participantes</h5>
            ${participantsListHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        try {
          await fetchActivities(); // Primero actualizamos la lista
          messageDiv.textContent = result.message;
          messageDiv.className = "success";
          signupForm.reset();
        } catch (updateError) {
          console.error("Error updating activities:", updateError);
          messageDiv.textContent = "Signed up successfully but failed to refresh the list. Please reload the page.";
          messageDiv.className = "warning";
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle participant deletion
  document.addEventListener("click", async (event) => {
    if (!event.target.matches(".delete-participant")) return;

    const activity = event.target.dataset.activity;
    const email = event.target.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        // Refresh activities list to show the updated participants
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

let ready = null;
let attempt = 0;
let maxAttempt = 10;
function readiness() {
  attempt++;
  let counter = ".".repeat(attempt);
  document.getElementById(
    "readiness"
  ).innerHTML = `<center><div class="loader"></div>${counter}</center>`;
  fetch("<%=payload.gatewayUrl%>/api/readiness", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        if (attempt >= maxAttempt) {
          logout();
        }
        ready = setTimeout(readiness, 10000);
      }
    })
    .then((data) => {
      if (data.point != null) {
        let datePoint = new RegExp("^[0-9]{8}T[0-9]{6}$");
        if (datePoint.test(data.point)) {
          window.location.replace("<%=payload.rootUrl%>/dashboard");
        } else {
          if (attempt >= maxAttempt) {
            logout();
          }
          ready = setTimeout(readiness, 1000);
        }
      } else {
        if (attempt >= maxAttempt) {
          logout();
        }
        ready = setTimeout(readiness, 1000);
      }
    })
    .catch((e) => {
      if (attempt >= maxAttempt) {
        logout();
      }
      ready = setTimeout(readiness, 1000);
    });
}
try {
  readiness();
} catch (e) {
  notify(e);
  if (attempt >= maxAttempt) {
    logout();
  }
  ready = setTimeout(readiness, 10000);
}

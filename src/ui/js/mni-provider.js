//=====================================================================
// MarlinDT Network Intelligence (MNI) - JavaScript: Provider
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//
let ready = null;
let retryMs = 5000;
let refreshMs = 300000;
let chartProvider = null;
let emailProvider = 0;
let kafkaProvider = 0;
let mapProvider = 0;
let workflowProvider = 0;
function fetchProviderStats() {
  if (ready != null) {
    clearTimeout(ready);
  }

  fetch(localStorage.getItem("mni.gatewayUrl") + "/ui/statistic", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    keepalive: true,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } //else {
        //ready = setTimeout(fetchProviderStats, retryMs);
      //}
    })
    .then((data) => {
      if (data.providers != null) {
        {
          if (data.providers?.email != null) {
            emailProvider = toInteger(data.providers.email);
          }
          if (data.providers?.kafka != null) {
            kafkaProvider = toInteger(data.providers.kafka);
          }
          if (data.providers?.map != null) {
            mapProvider = toInteger(data.providers.map);
          }
          if (data.providers?.workflow != null) {
            workflowProvider = toInteger(data.providers.workflow);
          }
        }
      }
      Chart.defaults.font.family = "Lato";
      if (chartProvider != null) {
        chartProvider.data.datasets[0].data[0] = emailProvider;
        chartProvider.data.datasets[0].data[1] = kafkaProvider;
        chartProvider.data.datasets[0].data[2] = mapProvider;
        chartProvider.data.datasets[0].data[3] = workflowProvider;
        chartProvider.update();
      } else {
        chartProvider = new Chart("providerSummary", {
          type: "bar",
          options: {
            indexAxis: "y",
            responsive: true,
            scales: {
              x: {
                display: false,
                stacked: true,
                grid: {
                  display: false,
                },
                scales: {
                  x: {
                    display: false,
                  },
                },
              },
              y: {
                stacked: true,
                grid: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          },
          data: {
            labels: ["Email", "Kafka", "Map", "Workflow"],
            datasets: [
              {
                data: [
                  emailProvider,
                  kafkaProvider,
                  mapProvider,
                  workflowProvider,
                ],
                backgroundColor: "rgba(109,43,220,1)",
                hoverBackgroundColor: "rgba(73,16,171,1)",
              },
            ],
          },
        });
      }
      ready = setTimeout(fetchProviderStats, refreshMs);
    })
    .catch((e) => {
      notify(e);
      //ready = setTimeout(fetchProviderStats, retryMs);
    });
}
try {
  fetchProviderStats();
} catch (e) {
  notify(e);
  //ready = setTimeout(fetchProviderStats, retryMs);
}

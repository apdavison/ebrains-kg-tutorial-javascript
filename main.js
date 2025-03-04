/*
Simple example of loading data from the EBRAINS KG in a web page.

For local use, the variable "authToken" should be replaced with a valid EBRAINS authorization token.
*/

const baseUrl = "https://core.kg.ebrains.eu/v3/";
const authToken = "eyJhb...";
const config = {
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
};

async function getJSON(url) {
  response = await fetch(url, config);
  if (response.status === 200) {
    return await response.json();
  } else {
    return {
      error: response.status
    }
  }
}

async function loadDatasetVersion(datasetId) {
  response = await getJSON(
    baseUrl + "instances/" + datasetId + "?stage=RELEASED"
  );
  if (response.error) {
    if (response.error === 401) {
      throw new Error("You are not authenticated. Perhaps your token has expired?")
    } else {
      throw new Error("Error. Status code " + response.error)
    }
  } else {
    const datasetVersion = response.data;
    return datasetVersion;
  }
}

function displayDatasetVersion(datasetVersion) {
  let typeAnchor = document.getElementById("@type");
  typeAnchor.innerHTML = datasetVersion["@type"];

  const textPropertyNames = [
    "fullName",
    "versionIdentifier",
    "releaseDate"
  ];

  let anchor = null;
  for (let propertyName of textPropertyNames) {
    anchor = document.getElementById(propertyName);
    anchor.innerHTML =
      datasetVersion[`https://openminds.ebrains.eu/vocab/${propertyName}`];
  }

  const linkPropertyNames = [
    "accessibility",
    "digitalIdentifier",
  ];
  for (let propertyName of linkPropertyNames) {
    anchor = document.getElementById(propertyName);
    anchor.innerHTML =
      datasetVersion[`https://openminds.ebrains.eu/vocab/${propertyName}`]["@id"];
  }

  let tableAnchor = document.getElementsByTagName("table")[0];
  tableAnchor.style.display = "block";
}

function showError(error) {
  let anchor = document.getElementById("errorMessages");
  console.log(error);
  anchor.innerHTML = error;
  anchor.style.display = "block";
}

async function main() {
  const button = document.querySelector("button");

  button.addEventListener("click", async (event) => {
    const datasetVersionId = document.getElementById("datasetVersionID").value;
    try {
      const datasetVersion = await loadDatasetVersion(datasetVersionId);
      displayDatasetVersion(datasetVersion);
    } catch (error) {
      showError(error);
    }
  });
}

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

async function loadKGNode(nodeId) {
  response = await getJSON(
    baseUrl + "instances/" + nodeId + "?stage=RELEASED"
  );
  if (response.error) {
    if (response.error === 401) {
      throw new Error("You are not authenticated. Perhaps your token has expired?")
    } else {
      throw new Error("Error. Status code " + response.error)
    }
  } else {
    const node = response.data;
    return node;
  }
}

async function followLinks(node, propertyNames) {
  /*
    For the given list of property names, we get the link URI from the node,
    extract the UUID from the URI, then use this to retrieve the linked node from the KG.
    We then replace the original property in the node object
    with the linked node that we've retrieved.
  */
  for (let propertyName of propertyNames) {
    const propertyPath = `https://openminds.ebrains.eu/vocab/${propertyName}`;
    const uri = node[propertyPath]["@id"];
    const uuid = uri.split("/").slice(-1)[0];
    const linkedNode = await loadKGNode(uuid);
    node[propertyPath] = linkedNode;
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

  anchor = document.getElementById("accessibility");
  let propertyValue = datasetVersion[`https://openminds.ebrains.eu/vocab/accessibility`];
  anchor.innerHTML = propertyValue["https://openminds.ebrains.eu/vocab/name"];

  anchor = document.getElementById("digitalIdentifier");
  propertyValue = datasetVersion[`https://openminds.ebrains.eu/vocab/digitalIdentifier`];
  anchor.innerHTML = propertyValue["https://openminds.ebrains.eu/vocab/identifier"];

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
      const datasetVersion = await loadKGNode(datasetVersionId);
      await followLinks(datasetVersion, ["accessibility", "digitalIdentifier"]);
      displayDatasetVersion(datasetVersion);
    } catch (error) {
      showError(error);
    }
  });
}

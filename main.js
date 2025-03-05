/*
Simple example of loading data from the EBRAINS KG in a web page.

For local use, the variable "authToken" should be replaced with a valid EBRAINS authorization token.
*/

const baseUrl = "https://core.kg.ebrains.eu/v3/";
const authToken = "eyJhb...";

const globalConfig = {
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
};

async function getJSON(url) {
  response = await fetch(url, globalConfig);
  if (response.status === 200) {
    return await response.json();
  } else {
    return {
      error: response.status
    }
  }
}

async function postQuery(url, queryObj) {
  const config = {
    ...globalConfig,
    method: "POST",
    body: JSON.stringify(queryObj)
  }
  config.headers["Content-Type"] = "application/json";
  response = await fetch(url, config);
  if (response.status === 200) {
    return await response.json();
  } else {
    return {
      error: response.status
    }
  }
}

function checkResponse(response) {
  if (response.error) {
    if (response.error === 401) {
      throw new Error("You are not authenticated. Perhaps your token has expired?");
    } else {
      throw new Error("Error. Status code " + response.error);
    }
  } else {
    return response.data;
  }
}

async function loadKGNode(nodeId) {
  response = await getJSON(
    baseUrl + "instances/" + nodeId + "?stage=RELEASED"
  );
  return checkResponse(response);
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

async function queryKG(searchTerm) {
  const query = {
    "@context": {
      "@vocab": "https://core.kg.ebrains.eu/vocab/query/",
      query: "http://example.org/",
      propertyName: {
        "@id": "propertyName",
        "@type": "@id",
      },
      path: {
        "@id": "path",
        "@type": "@id",
      },
    },
    meta: {
      type: "https://openminds.ebrains.eu/core/DatasetVersion",
      responseVocab: "http://example.org/",
    },
    structure: [
      {
        propertyName: "query:fullName",
        path: [
          {
            "@id": "https://openminds.ebrains.eu/vocab/hasVersion",
            reverse: true,
          },
          "https://openminds.ebrains.eu/vocab/fullName",
        ],
        required: true,
        filter: {
          op: "CONTAINS",
          value: searchTerm,
        },
      },
      {
        propertyName: "query:versionIdentifier",
        path: "https://openminds.ebrains.eu/vocab/versionIdentifier",
      },
      {
        propertyName: "query:releaseDate",
        path: "https://openminds.ebrains.eu/vocab/releaseDate",
      },
      {
        propertyName: "query:digitalIdentifier",
        singleValue: "FIRST",
        path: [
          "https://openminds.ebrains.eu/vocab/digitalIdentifier",
          "https://openminds.ebrains.eu/vocab/identifier",
        ],
      },
      {
        propertyName: "query:repository",
        path: "https://openminds.ebrains.eu/vocab/repository",
        singleValue: "FIRST",
        structure: [
          {
            propertyName: "query:name",
            path: "https://openminds.ebrains.eu/vocab/name",
          },
          {
            propertyName: "query:IRI",
            path: "https://openminds.ebrains.eu/vocab/IRI",
          },
        ],
      },
      {
        propertyName: "query:dataType",
        path: [
          "https://openminds.ebrains.eu/vocab/dataType",
          "https://openminds.ebrains.eu/vocab/name",
        ],
        singleValue: "FIRST",
      },
      {
        propertyName: "query:ethicsAssessment",
        path: [
          "https://openminds.ebrains.eu/vocab/ethicsAssessment",
          "https://openminds.ebrains.eu/vocab/name",
        ],
        singleValue: "FIRST",
      },
      {
        propertyName: "query:experimentalApproach",
        path: [
          "https://openminds.ebrains.eu/vocab/experimentalApproach",
          "https://openminds.ebrains.eu/vocab/name",
        ],
      },
      {
        propertyName: "query:studyTarget",
        path: [
          "https://openminds.ebrains.eu/vocab/studyTarget",
          "https://openminds.ebrains.eu/vocab/name",
        ],
      },
    ],
  };
  response = await postQuery(
    baseUrl + "queries/?stage=RELEASED&size=10",
    query
  );
  return checkResponse(response);
}

function displayDatasetVersion(datasetVersion, index) {
  /* Return a string containing an HTML table containing dataset version properties. */
  let repo = "-";
  if (datasetVersion.repository !== null) {
    repo = datasetVersion.repository.IRI;
  }
  return `<div class="datasetVersion">
    <p>#${parseInt(index) + 1}</p>
    <table>
      <tbody>
        <tr>
          <th>Full name</th>
          <td id="fullName-${index}">${datasetVersion.fullName}</td>
        </tr>
        <tr>
          <th>Version identifier</th>
          <td id="versionIdentifier-${index}">${datasetVersion.versionIdentifier}</td>
        </tr>
        <tr>
          <th>Release date</th>
          <td id="releaseDate-${index}">${datasetVersion.releaseDate || "-"}</td>
        </tr>
        <tr>
          <th>Digital identifier</th>
          <td id="digitalIdentifier-${index}">${datasetVersion.digitalIdentifier}</td>
        </tr>
        <tr>
          <th>Repository</th>
          <td id="repository-${index}">${repo}</td>
        </tr>
        <tr>
          <th>Data type</th>
          <td id="dataType-${index}">${datasetVersion.dataType}</td>
        </tr>
        <tr>
          <th>Ethics assessment</th>
          <td id="ethicsAssessment-${index}">${datasetVersion.ethicsAssessment}</td>
        </tr>
        <tr>
          <th>Experimental approach</th>
          <td id="experimentalApproach-${index}">${datasetVersion.experimentalApproach.join(", ")}</td>
        </tr>
         <tr>
          <th>Study target</th>
          <td id="studyTarget-${index}">${datasetVersion.studyTarget.join(", ")}</td>
        </tr>
      </tbody>
    </table>
  </div>`
}

function showError(error) {
  let anchor = document.getElementById("errorMessages");
  anchor.innerHTML = error;
  anchor.style.display = "block";
}

function removeError() {
  let anchor = document.getElementById("errorMessages");
  anchor.innerHTML = "";
  anchor.style.display = "none";
}

async function main() {
  const button = document.querySelector("button");

  button.addEventListener("click", async (event) => {
    const searchTerm = document.getElementById("searchTerm").value;
    const anchor = document.getElementById("results");
    anchor.innerHTML = "";
    removeError();
    try {
      const datasetVersions = await queryKG(searchTerm);
      console.log(datasetVersions);
      if (datasetVersions.length > 0) {
        for (let index in datasetVersions) {
          anchor.innerHTML +=  displayDatasetVersion(datasetVersions[index], index);
        }
      } else {
        throw new Error(`No results for query "${searchTerm}"`);
      }
    } catch (error) {
      showError(error);
    }
  });
}

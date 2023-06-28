let launchForm = document.getElementById("launch-ipo-form");

document.getElementById("basic-ipo-next").onclick = (event) => {
  console.log(sessionStorage);
  event.preventDefault();
  let basicIPOForm = document.getElementById("basic-ipo-form");
  console.log(basicIPOForm);
  if (basicIPOForm.checkValidity()) {
    document.getElementById("nav-ipo-bucket-tab").click();
  } else {
    basicIPOForm.reportValidity();
  }
};

document.getElementById("ipo-bucket-next").onclick = (event) => {
  event.preventDefault();
  let bucketsForm = document.getElementById("buckets-form");
  document.getElementById("nav-investor-classification-tab").click();
};

document.getElementById("final-submit-button").onclick = async (event) => {
  event.preventDefault();
  let basicIPOForm = document.getElementById("basic-ipo-form");
  let investorForm = document.getElementById("investor-classification-form");
  let basicData = $("#basic-ipo-form").serializeArray();
  let investorData = $("#investor-classification-form").serializeArray();

  // Check if the buckets form exists
  let bucketsForm = document.getElementById("buckets-form");
  let bucketsData = null;
  if (bucketsForm) {
    bucketsData = $("#buckets-form").serializeArray();
  }

  if (!basicIPOForm.checkValidity()) {
    document.getElementById("basic-ipo-details-tab").click();
    basicIPOForm.reportValidity();
    return;
  }

  if (!investorForm.checkValidity()) {
    investorForm.reportValidity();
    return;
  }

  let finalData = {};

  basicData.map((item) => {
    finalData[item.name] = item.value;
  });

  investorData.map((item) => {
    finalData[item.name] = item.value;
  });

  if (bucketsData) {
    bucketsData.map((item) => {
      finalData[item.name] = item.value;
    });
  }

  console.log(finalData);
  $("#launch-ipo-textarea").val(JSON.stringify(finalData));
  $("#launch-ipo-submit-button").click();
};

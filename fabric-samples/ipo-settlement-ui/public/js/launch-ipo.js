let launchForm = document.getElementById('launch-ipo-form');

document.getElementById("basic-ipo-next").onclick = (event) => {
    console.log(sessionStorage);
    event.preventDefault()
    let basicIPOForm = document.getElementById('basic-ipo-form')
    console.log(basicIPOForm);
    if (basicIPOForm.checkValidity()) {
        document.getElementById("nav-ipo-bucket-tab").click()
    } else {
        basicIPOForm.reportValidity()
    }
}

document.getElementById("ipo-bucket-next").onclick = (event) => {
    event.preventDefault()
    let bucketsForm = document.getElementById('buckets-form')
    if (bucketsForm.checkValidity()) {
        document.getElementById("nav-investor-classification-tab").click()
    } else {
        bucketsForm.reportValidity()
    }
}


document.getElementById("final-submit-button").onclick = async (event) => {

    event.preventDefault()
    let bucketsForm = document.getElementById('buckets-form')
    let basicIPOForm = document.getElementById('basic-ipo-form')
    let investorForm = document.getElementById('investor-classification-form')
    let bucketsData = $('#buckets-form').serializeArray()
    let basicData = $('#basic-ipo-form').serializeArray()
    let investorData = $('#investor-classification-form').serializeArray()
    if (!basicIPOForm.checkValidity()) {
        document.getElementById("basic-ipo-details-tab").click()
        basicIPOForm.reportValidity()
        return
    }
    if (!bucketsForm.checkValidity()) {
        document.getElementById("nav-ipo-bucket-tab").click()
        bucketsForm.reportValidity()
        return
    }
    if (!investorForm.checkValidity()) {
        investorForm.reportValidity()
        return
    }
    let finalData = {}
    bucketsData.map((item) => {
        finalData[item.name] = item.value
    })
    basicData.map((item) => {
        finalData[item.name] = item.value
    })
    investorData.map((item) => {
        finalData[item.name] = item.value
    })
    console.log(finalData);
    $('#launch-ipo-textarea').val(JSON.stringify(finalData))
    $('#launch-ipo-submit-button').click()
    // try {
    //     const rawResponse = await fetch('/launch-ipo/', {
    //         method: 'POST',
    //         credentials: "same-origin",
    //         headers: {
    //             'Accept': 'application/json',
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify(finalData)
    //     });
    //     const content = await rawResponse.json();
    //     console.log(content);
    // } catch (e) {
    //     console.error(e);
    // }
}
const goTest = (subject) => {
    let num = $("#num").val()
    location.href = `/test/${subject}?num=${num}`
}
const goQuestionBank = (subject) => {
    location.href = `/questionbank/${subject}`
}
let user_answers = {}
const overTest = (subject, num) => {
    user_answers["subject"] = subject
    user_answers["num"] = num
    $.ajax({
        type: "POST",
        url: "/correct/radio",
        dataType: "json",
        data: user_answers,
        success: function (response) {
            score = response[0]
            alert(`成績：${score}\n${response[1]}`)
            location.href = "/index"
        },
        error: function (thrownError) {
            alert("發生錯誤")
            console.log(thrownError);
        }
    });
}


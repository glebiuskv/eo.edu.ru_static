(function() {
    var j_username = $('#j_username'),
        j_password = $('#j_password'),
        loginBtn = $('#loginBtn'),
        loginForm = $('#loginForm'),
        loginMessage = $('#loginMessage');

    function keyDown(eventData) {
        if (eventData.keyCode === 13) {
            if (j_username.val() !== '' && j_password.val() !== '') {
                loginBtn.click();
            }
        }
    }

    $(function () {
        loginBtn.click(function () {
            loginForm.validate({
                onsubmit: false
            });
            if (loginForm.valid()) {
                loginForm.submit();
            }

            return false;
        });

        j_username.keydown(keyDown);
        j_password.keydown(keyDown);

        if (window.location.search.indexOf('login_error=1') !== -1) {
            loginMessage
                .html('Неверное имя пользователя или пароль.<br/>Проверьте правильность введенных данных.')
                .removeClass('hidden');
        }
    });
}());

app.controller("RegistrationApplicationController", function ($scope, RegistrationApplicationService) {

    var userCredentials = [];

    $scope.renderingNotification = function () {
        alert("The page has been rendered!");
    }

    /* ----------------- SUBMIT ----------------- */
    $scope.submitFunc = function () {

        /* Will search if the user is already existing */
        var userSearch = userCredentials.find(uSearch => uSearch.FirstName === $scope.first_name && uSearch.LastName === $scope.last_name);

        if (userSearch == undefined) {

            /* Key-pair values that will be stored in the array */
            userCredentials.push({
                FirstName: $scope.first_name,
                MiddleName: $scope.middle_name,
                LastName: $scope.last_name,
                UserAddress: $scope.address,
                UserPhone: $scope.phone_number,
                UserEmail: $scope.email,
                UserPassword: $scope.last_name + $scope.phone_number,
                UserName: $scope.first_name + "." + $scope.last_name
            });

            alert(userCredentials.length);
            $scope.cancelFunc();
            window.location.href = "/Home/LoginPage";

        } else {

            alert("Data is already exsisting!");
            $scope.cancelFunc();
        }

    }

    /* ----------------- CANCEL ----------------- */
    $scope.cancelFunc = function () {
        $scope.first_name = null;
        $scope.middle_name = null;
        $scope.last_name = null;
        $scope.address = null;
        $scope.phone_number = null;
        $scope.email = null;
        $scope.password = null;

    }

})


/*var tempVariable = $scope.first_name;
var tempLastName = $scope.last_name;
alert(tempVariable + tempLastName);*/
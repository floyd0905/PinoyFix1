app.controller("RegistrationApplicationController", function ($scope) {
    var userCredentials = [];

    // Phone number validation function
    $scope.validatePhoneNumber = function () {
        const phonePattern = /^\d{11}$/;
        $scope.phone_number_error = !$scope.phone_number || !phonePattern.test($scope.phone_number);
    };

    // Email validation function
    $scope.validateEmail = function () {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        $scope.email_error = !$scope.email || !emailPattern.test($scope.email);
    };

    $scope.submitFunc = function () {
        //Final validation bago isubmit
        $scope.validatePhoneNumber();
        $scope.validateEmail();

        // Validate if complete ba yung fields
        if (!$scope.first_name || !$scope.middle_name || !$scope.last_name || !$scope.address || !$scope.email || !$scope.password || $scope.phone_number_error || $scope.email_error) {
            alert("Please fill in all required fields with valid data.");
            return;
        }

        // Push the user data into the array if everything is valid
        userCredentials.push({
            firstName: $scope.first_name,
            lastName: $scope.last_name,
            middleName: $scope.middle_name,
            email: $scope.email,
            password: $scope.password,
            address: $scope.address,
            phoneNumber: $scope.phone_number
        });

        // Store the users in localStorage
        localStorage.setItem('userCredentials', JSON.stringify(userCredentials));

        alert("Registration successful!");
        window.location.href = "/Home/LoginPage";
    };
});
app.controller("LoginController", function ($scope) {
    $scope.renderingNotification = function () {
        alert("Login page loaded!");
    }

    $scope.login = function () {
        // Retrieve user credentials from localStorage
        var storedUsers = JSON.parse(localStorage.getItem('userCredentials'));

        // Reset error flags
        $scope.email_error = false;
        $scope.password_error = false;

        // Check if storedUsers exists
        if (!storedUsers) {
            $scope.email_error = true;
            return;
        }

        // Check if the email exists
        var validUser = storedUsers.find(user => user.email === $scope.email);

        if (!validUser) {
            // Set error if email is not found
            $scope.email_error = true;
            return;
        }

        // Check if the password is correct
        if (validUser.password !== $scope.password) {
            // Set error flag if password is incorrect
            $scope.password_error = true;
        } else {
            // Store the logged-in user data in localStorage
            localStorage.setItem('loggedInUser', JSON.stringify(validUser));
            alert("Login successful!");
            window.location.href = "/Home/Dashboard";
        }
    };
});

app.controller("DashboardController", function ($scope) {
    // Retrieve the logged-in user from localStorage
    var loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    // Update the main title with the user's first name
    if (loggedInUser && loggedInUser.firstName) {
        $scope.mainTitle = `Hey there ${loggedInUser.firstName}, feel free to explore.`;
    } else {
        $scope.mainTitle = "Hey there, feel free to explore.";
    }
});


/*------------------------- LESSON CODES ----------------------------*/ 

/*    $scope.submitFunc2 = function () {
        var registrationInfo = {
            FirstName: $scope.first_name,
            LastName: $scope.last_name,
            Address: $scope.address,
            PhoneNumber: $scope.phone_number, 
        }

        var postData = RegistrationApplicationService.postData(registrationInfo);
        postData.then(function (ReturnedData) {
            var returnedValue = ReturnedData.data;
            alert(returnedValue);
        })
    }



------------------- SUBMIT -----------------------
$scope.submitFunc = function () {

    Will search if the user is already existing
    var userSearch = userCredentials.find(uSearch => uSearch.FirstName === $scope.first_name && uSearch.LastName === $scope.last_name);

    if (userSearch == undefined) {

        Key-pair values that will be stored in the array
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

------------------- CANCEL -----------------------
$scope.cancelFunc = function () {
    $scope.first_name = null;
    $scope.middle_name = null;
    $scope.last_name = null;
    $scope.address = null;
    $scope.phone_number = null;
    $scope.email = null;
    $scope.password = null;

}

------------------- USER FUNC -----------------------
$scope.userFunc = function () {
    var getData = RegistrationApplicationService.getUserAlert();
    getData.then(function (ReturnedData) {
        var returnedValue = ReturnedData.data;
        alert(returnedValue);
    });
}

------------------- USER ACCESS FUNC -----------------------
$scope.userAccessFunc = function () {
    var getdata = RegistrationApplicationService.getUserAccess(1, "Sydney");
    getData.then(function (ReturnedData) {
        var returnedValue = ReturnedData.data;
        alert(returnedValue);
        swal({
            title: "Good job!",
            text: returnedValue,
            icon: "success"
        });
    });
}

*/

/*var tempVariable = $scope.first_name;
var tempLastName = $scope.last_name;
alert(tempVariable + tempLastName);*/
var myApp = angular.module('myApp', []);

myApp.controller('myController', ['$scope', '$http', function ($scope, $http) {

    $scope.first_name = '';
    $scope.middle_name = '';
    $scope.last_name = '';
    $scope.address = '';
    $scope.phone_number = '';
    $scope.email = '';
    $scope.password = '';

    $scope.validationErrors = {
        phone_number_error: false,
        email_error: false,
        password_error: false
    };

    $scope.validatePhoneNumber = function () {
        const phonePattern = /^\d{11}$/;
        $scope.validationErrors.phone_number_error = !$scope.phone_number || !phonePattern.test($scope.phone_number);
    };

    $scope.validateEmail = function () {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        $scope.validationErrors.email_error = !$scope.email || !emailPattern.test($scope.email);
    };

    $scope.validatePassword = function () {
        const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
        $scope.validationErrors.password_error = !$scope.password || !passwordPattern.test($scope.password);
    };

    $scope.submitFunc = function () {
        $scope.validatePhoneNumber();
        $scope.validateEmail();
        $scope.validatePassword();

        if ($scope.validationErrors.phone_number_error ||
            $scope.validationErrors.email_error ||
            $scope.validationErrors.password_error) {
            alert("Please correct the errors before submitting.");
            return;
        }

        const formData = {
            first_name: $scope.first_name,
            middle_name: $scope.middle_name,
            last_name: $scope.last_name,
            address: $scope.address,
            phone_number: $scope.phone_number,
            email: $scope.email,
            password: $scope.password
        };

        $http.post('http://localhost:3000/register', formData)
            .then(function (response) {
                const userCredentials = JSON.parse(localStorage.getItem('userCredentials') || '[]');
                userCredentials.push(formData);
                localStorage.setItem('userCredentials', JSON.stringify(userCredentials));

                alert("Registration successful!");
                window.location.href = "/Home/LoginPage";
            })
            .catch(function (error) {
                console.error("Registration failed:", error);
                alert("An error occurred during registration. Please try again.");
            });
    };

    $scope.cancelFunc = function () {
        $scope.first_name = '';
        $scope.middle_name = '';
        $scope.last_name = '';
        $scope.address = '';
        $scope.phone_number = '';
        $scope.email = '';
        $scope.password = '';
    };
}]);

myApp.controller('LoginController', ['$scope', '$http', '$window', function ($scope, $http, $window) {
    $scope.login = function () {
        const loginData = {
            email: $scope.email,
            password: $scope.password
        };

        $http.post('http://localhost:3000/login', loginData)
            .then(function (response) {
                if (response.status === 200 && response.data.message) {
                    alert(response.data.message);
                    $window.location.href = '/Home/HomePage';
                } else {
                    alert('An unexpected response was received');
                }
            })
            .catch(function (error) {
                if (error.status === 400 || error.status === 401) {
                    alert('Invalid email or password');
                } else {
                    console.error('Error storing credentials:', error);
                    alert('An error occurred while storing credentials.');
                }
            });
    };
}]);

myApp.controller('ImageUploadController', ['$scope', '$window', '$http', function ($scope, $window, $http) {
    $scope.postImage = function () {
        const tags = [];
        const tagElements = document.querySelectorAll('.tag');

        tagElements.forEach(tag => {
            tags.push(tag.textContent);
        });

        const imageInput = document.getElementById('imageInput');
        const file = imageInput.files[0];

        if (!file) {
            alert("Please upload an image.");
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('tags', JSON.stringify(tags));

        fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert('Image uploaded successfully!');
                } else {
                    alert('Image upload failed: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error uploading the image');
            });
    };
}]);

(function ()
{
    'use strict';

    angular
        .module('app.sample')
        .controller('SampleController', SampleController);

    /** @ngInject */
    function SampleController($scope, $http, $location)
    {
        //var vm = this;

        // Data
        //vm.helloText = SampleData.data.helloText;

        // Methods

        //////////
        $http.get("https://api.github.com/repos/narendhar11/gulp-release/releases?access_token=ff72e13727e83506b7407643fc5fabff4650decb")
        .then(function(response) {
            $scope.myWelcome = response.data;            
            if ($location.host() == 'conedmms.cniguard.com') {
                angular.forEach($scope.myWelcome, function(value){
                    if(value.prerelease == false){
                        $scope.env = 'Production'
                        $scope.releaseVersion = value.tag_name;
                    }                    
                });
            }else{
                angular.forEach($scope.myWelcome, function(value){
                    if(value.prerelease == true){
                        $scope.env = 'Test'
                        $scope.releaseVersion = value.tag_name;
                    }                    
                });
            }
            
            
            
            
        });

        
    }
})();

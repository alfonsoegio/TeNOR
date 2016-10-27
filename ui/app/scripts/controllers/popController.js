'use strict';

angular.module('tNovaApp')
    .controller('PoPController', function ($scope, $window, $interval, $modal, $alert, tenorService, AuthService, infrRepoService) {

        $scope.defaultPoP = {};
        $scope.registeredDcList = [];
        $scope.keystone_versions = [{"id": "v2.0"}, {"id": "v3"}];
        $scope.heat_versions = [{"id": "v1"}];
        $scope.compute_versions = [{"id": "v2.1"}];
        $scope.neutron_versions = [{"id": "v2.0"}];

        $scope.keystone_version = "v2.0"
        $scope.heat_version = "v1"
        $scope.compute_version = "v2.1"
        $scope.neutron_version = "v2.0"

        $scope.openstack_ip = "";

        $scope.refreshPoPList = function () {
            tenorService.get('pops/dc').then(function (d) {
            //AuthService.get($window.localStorage.token, "admin/dc/").then(function (d) {
                console.log(d);
                $scope.registeredDcList = d;


                /*_.map(d.dclist, function (row, index) {
                    $scope.registeredDcList.push({
                        id: d.dcid[index],
                        name: row
                    })
                });*/
                console.log($scope.registeredDcList);

                var url = 'pop/';
                infrRepoService.get(url).then(function (_data) {
                    $scope.pops = _data;
                    $scope.availableDcList = [];
                    angular.forEach(_data, function (pop, index, array) {
                        url = pop.identifier.slice(1);
                        infrRepoService.get(url).then(function (_data) {

                            var exist = _.some($scope.registeredDcList, function (c) {
                                return _data.attributes['occi.epa.popuuid'] !== c;
                            });
                            console.log(exist);
                            if (!exist) {
                                $scope.availableDcList.push(_data.attributes);
                            }
                        });
                    });
                });
            });
        };
        $scope.refreshPoPList();

        $scope.addDialog = function (id) {
            if (id === "") {
                $scope.emptyId = true;
            }
            $scope.object = $scope.defaultPoP;
            $scope.object.id = id;
            $scope.dc_default = $scope.defaultPoP;
            $scope.openstack_ip = "";
            $scope.dc_default = {
                msg: "Description",
                id: "infrRepository-Pop-ID",
                adminid: "admin",
                password: "adminpass",
                isAdmin: false,
                openstack_ip: $scope.openstack_ip,
                keystone_api: $scope.openstack_ip + ":35357/" + $scope.keystone_version,
                heat_api: $scope.openstack_ip + ":8004/v1",
                compute_api: $scope.openstack_ip + ":8774/v2.1",
                neutron_api: $scope.openstack_ip + ":9696/v2.0",
                dns: "8.8.8.8"
            };
            $modal({
                title: "Registring DC - " + id,
                template: "views/t-nova/modals/addPop.html",
                show: true,
                scope: $scope,
            });
        };

        $scope.registerDc = function (obj) {
            var pop = {
                "name": obj.id,
                "user": obj.adminName,
                "host": openstack_ip,
                "password": obj.adminPass,
                "tenant_name": obj.tenantName,
                "is_admin": obj.isAdmin,
                "description": obj.msg,
                "extra_info": "keystone-endpoint=http://" + obj.keystone_api + " orch-endpoint=http://" + obj.heat_api + " compute-endpoint=http://" + obj.compute_api + " neutron-endpoint=http://" + obj.neutron_api + " dns=" + obj.dns
            };
            console.log(pop);
            tenorService.post('pops/dc', pop).then(function (d) {
                console.log(d);
                $scope.defaultPoP = {};
                $alert({
                    title: "Success: ",
                    content: "PoP inserted correctly.",
                    placement: 'top',
                    type: 'success',
                    keyboard: true,
                    show: true,
                    container: '#alerts-container',
                    duration: 5
                });
                $scope.refreshPoPList();
            }, function errorCallback(response) {
                console.log("Error");
                console.log(response);
                $scope.defaultPoP = obj;
                $alert({
                    title: "Error: ",
                    content: "PoP not created correctly.",
                    placement: 'top',
                    type: 'danger',
                    keyboard: true,
                    show: true,
                    container: '#alerts-container',
                    duration: 5
                });
            });
            this.$hide();
        };

        $scope.getPopInfo = function (popId) {
            tenorService.get('pops/dc/' + popId).then(function (data) {
                console.log(data);
                $scope.popInfo = data;
                $scope.jsonObj = JSON.stringify(data, undefined, 4);
                $modal({
                    title: "Pop - " + popId,
                    template: "views/t-nova/modals/info/showPop.html",
                    show: true,
                    scope: $scope,
                });
            });
        };

        $scope.removePopDialog = function (id) {
            $scope.itemToDeleteId = id;
            $modal({
                title: "Are you sure you want to delete this item?",
                template: "views/t-nova/modals/delete.html",
                show: true,
                scope: $scope,
            });
        };

        $scope.deleteItem = function (popId) {
            tenorService.delete('gatekeeper/dc/' + popId).then(function (data) {
                console.log(data);
                $scope.refreshPoPList();
            });
            this.$hide();
        };

    }).controller('PoPModalController', function ($scope, $window, $interval, $modal, $alert, tenorService, AuthService, infrRepoService) {
        $scope.updateOpenstackIP = function () {
            var openstack_ip = $scope.openstack_ip;

            //var keystone_version = $scope.dc_default.keystone_api.split(":")[1]
            var keystone_port = $scope.dc_default.keystone_api.split(":")[1].split("/")[0]
            var heat_port = $scope.dc_default.heat_api.split(":")[1].split("/")[0]
            var compute_port = $scope.dc_default.compute_api.split(":")[1].split("/")[0]
            var neutron_port = $scope.dc_default.neutron_api.split(":")[1].split("/")[0]
            $scope.dc_default = {
                msg: $scope.dc_default.msg,
                id: $scope.dc_default.id,
                adminName: $scope.dc_default.adminName,
                tenantName: $scope.dc_default.tenantName,
                adminPass: $scope.dc_default.adminPass,
                isAdmin: $scope.dc_default.isAdmin,
                openstack_ip: openstack_ip,
                keystone_api: openstack_ip + ":" + keystone_port + "/" + $scope.keystone_version,
                heat_api: openstack_ip + ":" + heat_port + "/" + $scope.heat_version,
                compute_api: openstack_ip + ":" + compute_port + "/" + $scope.compute_version,
                neutron_api: openstack_ip + ":" + neutron_port + "/" + $scope.neutron_version,
                dns: $scope.dc_default.dns
            }
        };
    });

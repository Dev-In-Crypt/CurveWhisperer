// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CurveWhispererOracle.sol";

contract DeployOracle is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        CurveWhispererOracle oracle = new CurveWhispererOracle();
        console.log("Oracle deployed at:", address(oracle));
        console.log("Owner:", oracle.owner());

        vm.stopBroadcast();
    }
}

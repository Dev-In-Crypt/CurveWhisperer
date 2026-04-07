// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CurveWhispererOracle.sol";

contract OracleTest is Test {
    CurveWhispererOracle oracle;
    address deployer = address(this);
    address user = address(0xBEEF);
    address token1 = address(0x1111);
    address token2 = address(0x2222);

    function setUp() public {
        oracle = new CurveWhispererOracle();
    }

    function test_ownerIsDeployer() public view {
        assertEq(oracle.owner(), deployer);
    }

    function test_updateScore() public {
        oracle.updateScore(token1, 75, "Strong velocity", "high");

        CurveWhispererOracle.Score memory s = oracle.getScore(token1);
        assertEq(s.score, 75);
        assertEq(s.timestamp, uint40(block.timestamp));
        assertEq(s.reason, "Strong velocity");
        assertEq(s.confidence, "high");
    }

    function test_updateScoreEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit CurveWhispererOracle.ScoreUpdated(token1, 80, "medium", uint40(block.timestamp));

        oracle.updateScore(token1, 80, "Good momentum", "medium");
    }

    function test_updateScoreRevertsForNonOwner() public {
        vm.prank(user);
        vm.expectRevert("Not owner");
        oracle.updateScore(token1, 50, "test", "low");
    }

    function test_scoreAbove100Reverts() public {
        vm.expectRevert("Score must be 0-100");
        oracle.updateScore(token1, 101, "invalid", "low");
    }

    function test_overwriteScore() public {
        oracle.updateScore(token1, 50, "Initial", "low");
        oracle.updateScore(token1, 90, "Updated", "high");

        CurveWhispererOracle.Score memory s = oracle.getScore(token1);
        assertEq(s.score, 90);
        assertEq(s.reason, "Updated");
    }

    function test_unknownTokenReturnsDefault() public view {
        CurveWhispererOracle.Score memory s = oracle.getScore(address(0xDEAD));
        assertEq(s.score, 0);
        assertEq(s.timestamp, 0);
    }

    function test_scoreHistory() public {
        oracle.updateScore(token1, 30, "Low", "low");
        vm.warp(block.timestamp + 60);
        oracle.updateScore(token1, 60, "Medium", "medium");
        vm.warp(block.timestamp + 60);
        oracle.updateScore(token1, 90, "High", "high");

        CurveWhispererOracle.Score[] memory history = oracle.getScoreHistory(token1, 10);
        assertEq(history.length, 3);
        assertEq(history[0].score, 30);
        assertEq(history[2].score, 90);
    }

    function test_scoreHistoryLimit() public {
        oracle.updateScore(token1, 10, "a", "low");
        oracle.updateScore(token1, 20, "b", "low");
        oracle.updateScore(token1, 30, "c", "low");

        CurveWhispererOracle.Score[] memory history = oracle.getScoreHistory(token1, 2);
        assertEq(history.length, 2);
        assertEq(history[0].score, 20);
        assertEq(history[1].score, 30);
    }

    function test_scoreHistoryLength() public {
        assertEq(oracle.getScoreHistoryLength(token1), 0);
        oracle.updateScore(token1, 50, "test", "low");
        assertEq(oracle.getScoreHistoryLength(token1), 1);
    }

    function test_markGraduated() public {
        vm.expectEmit(true, false, false, true);
        emit CurveWhispererOracle.TokenGraduated(token1, uint40(block.timestamp));
        oracle.markGraduated(token1);
    }

    function test_markGraduatedRevertsForNonOwner() public {
        vm.prank(user);
        vm.expectRevert("Not owner");
        oracle.markGraduated(token1);
    }
}

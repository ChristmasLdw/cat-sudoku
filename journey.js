/* Frozen original 196-level route plus the append-200.cjs expansion.
 * Preserve existing entries and IDs; additions are rated by rate-level.cjs. */
(function(root){'use strict';
const config={
  "units": [
    {
      "name": "初次见面",
      "tag": "跟着提示走完第一关",
      "cap": 2,
      "lessons": [
        15
      ],
      "id": 0,
      "start": 0,
      "count": 20
    },
    {
      "name": "猫生旅途",
      "tag": "空盘自由推理 · 卡住就用提示",
      "cap": 3,
      "lessons": [],
      "id": 1,
      "start": 20,
      "count": 47
    },
    {
      "name": "大胆假设",
      "tag": "需要假设试错的关卡 · 教一次就会了",
      "cap": 5,
      "lessons": [
        13
      ],
      "id": 2,
      "start": 67,
      "count": 22
    },
    {
      "name": "截图还原",
      "tag": "按原截图还原",
      "cap": 5,
      "lessons": [],
      "id": 10,
      "start": 89,
      "count": 7,
      "testPack": true
    },
    {
      "name": "百关挑战 · 第 1 组",
      "tag": "7 × 7 · 空盘自由推理",
      "cap": 5,
      "lessons": [],
      "id": 11,
      "start": 96,
      "count": 20,
      "extraPack": true
    },
    {
      "name": "百关挑战 · 第 2 组",
      "tag": "8 × 8 · 空盘自由推理",
      "cap": 5,
      "lessons": [],
      "id": 12,
      "start": 116,
      "count": 20,
      "extraPack": true
    },
    {
      "name": "百关挑战 · 第 3 组",
      "tag": "8 × 8 · 空盘自由推理",
      "cap": 5,
      "lessons": [],
      "id": 13,
      "start": 136,
      "count": 20,
      "extraPack": true
    },
    {
      "name": "百关挑战 · 第 4 组",
      "tag": "9 × 9 · 空盘自由推理",
      "cap": 5,
      "lessons": [],
      "id": 14,
      "start": 156,
      "count": 20,
      "extraPack": true
    },
    {
      "name": "百关挑战 · 第 5 组",
      "tag": "9 × 9 · 空盘自由推理",
      "cap": 5,
      "lessons": [],
      "id": 15,
      "start": 176,
      "count": 20,
      "extraPack": true
    },
    {
      "name": "自由漫游",
      "tag": "混合难度 · 空盘自由推理",
      "cap": 5,
      "lessons": [],
      "id": 16,
      "start": 196,
      "count": 200,
      "extraPack": true
    }
  ],
  "levels": [
    {
      "id": "garden-3577ffdbc2eaf39e",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-a2e4f5b129c094cf",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-25310f102bd2b40d",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-091b6df0cb6d8622",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-bb899edd51d058e8",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-afe5b25f0717f429",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-80be429b158a7a52",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-360693cf049a9c0a",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-e7958203d13b4970",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-d915327ad8ff592b",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-7934e02eb770bb40",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-38b7ebb6fecd21ec",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-165a94ffe3ba6dd2",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-de7839238a822d5a",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-76e3ef5127dc3df1",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-fc42eba6bbfb030c",
      "unit": 0,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-3457b7b792135f0e",
      "unit": 0,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-7827347e0d68b988",
      "unit": 0,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-dc131cc6cbc193e2",
      "unit": 0,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-2e463ae8f9bc2e52",
      "unit": 0,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-1af08f1cf40df0f1",
      "unit": 1,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-a31ab9484050ff4a",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-de2560a1e675444d",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-055afbee7f871eed",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "window",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-ee4d255c0d3fd54e",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-8be1dfb6c448de5c",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-e3287375c8c2f421",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-ff83edc4f56f702b",
      "unit": 1,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-2a033cb4756635b6",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-73077c1a4c16ab16",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-7855942a62f1ec32",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-96383ed219fbeaa0",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-0a7bd2f22c608a09",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-bafc638f0ebc40dd",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "yard",
      "unit": 1,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-d417a67d879ee5d3",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-3be8d54661fd20dd",
      "unit": 1,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-98eb04af57dca091",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-fc8b15cfa0e66cea",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-34d56e67bd11de16",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-b13511e0ed2d9c8f",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-fb2dd415d6ae15fb",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-b50142e7b974d5ac",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-b5d3d0acd10cb171",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-1eec98707609e75c",
      "unit": 1,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-edfb322b86600f73",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-21fad6fb4f3969a4",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-3115bf95cf5253fa",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-d9d74fa7dace233b",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-a109eca0fd6574d2",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-309fe430550aa453",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-f216b6411fa48dcd",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-c4d0837d7b942822",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-3010253034b124ba",
      "unit": 1,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-cf97c8daccb30660",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-5f498ac8e49b7404",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-4737375cf5501ab6",
      "unit": 1,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-f5c3bf2ce9d706fc",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-058f329fbf0af807",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-9e6f8cccb0db3819",
      "unit": 1,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "roof",
      "unit": 1,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-b15e5107d941c85a",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-3e4c609c58a3625c",
      "unit": 1,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-7cd24b1aa847aa25",
      "unit": 1,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-f0326c0d5cd0de9c",
      "unit": 1,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-04445c8fedb1ac63",
      "unit": 1,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-1dbc32e36cdd69e8",
      "unit": 2,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-e0ba14421c94e43b",
      "unit": 2,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-77416539431c2ee2",
      "unit": 2,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-60b622df826f1f96",
      "unit": 2,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-c054590132eeaff4",
      "unit": 2,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-297799ce663833fe",
      "unit": 2,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-9abb69824e258e7d",
      "unit": 2,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-8505e8c2a3c17da4",
      "unit": 2,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-fa4500de172e184b",
      "unit": 2,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-8e1e1ba86fa9c046",
      "unit": 2,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "moon",
      "unit": 2,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-3a974caa82a3c19b",
      "unit": 2,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-bc7b3b1bc504c500",
      "unit": 2,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-4747d5d13c42d804",
      "unit": 2,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-cc0529bba9389734",
      "unit": 2,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-ba5bc6aa41efa8f1",
      "unit": 2,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "stars",
      "unit": 2,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-4d77f8c659dcf3fd",
      "unit": 2,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-efa8d73edcefe3a2",
      "unit": 2,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-a5e79fac812aab64",
      "unit": 2,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-cd721a078ad43be4",
      "unit": 2,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-37f7a7b9b2ccb6f3",
      "unit": 2,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "screenshot-89",
      "unit": 10,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "screenshot-79",
      "unit": 10,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "screenshot-75",
      "unit": 10,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "screenshot-78",
      "unit": 10,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "screenshot-80",
      "unit": 10,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "screenshot-74",
      "unit": 10,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "screenshot-81",
      "unit": 10,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-08f73375f7cbc30b",
      "unit": 11,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-712fcbeaf79dbfb6",
      "unit": 11,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-e0bf94f467bc13df",
      "unit": 11,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-744ec694eb051ab0",
      "unit": 11,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-fce425edf2878184",
      "unit": 11,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-0de455137b28f1dd",
      "unit": 11,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-3db54027b7aeb849",
      "unit": 11,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-30cac10d1d8088e4",
      "unit": 11,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-12f9f89922555ebd",
      "unit": 11,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-faea0758d36ce841",
      "unit": 11,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-15cec2e40c401a9b",
      "unit": 11,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-46b9f379e9cb0193",
      "unit": 11,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-f130f798538023dc",
      "unit": 11,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-b6e68cd3b7443eaa",
      "unit": 11,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-024720f8e6e48d69",
      "unit": 11,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-70501efda7b3995e",
      "unit": 11,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-93f7c38ca94190b0",
      "unit": 11,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-889ad5612a4c6710",
      "unit": 11,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-0be306b097791739",
      "unit": 11,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-ce55a0f6ab1a5f79",
      "unit": 11,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-0d8223d03e4cc4b4",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-855c98a23e66cce0",
      "unit": 12,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-df044568cc5ac044",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-c577731ded185953",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-618a4043fe2e22ce",
      "unit": 12,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-ea484bb620ec7d4e",
      "unit": 12,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-264fcb437b47a3ca",
      "unit": 12,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-9a6a49b18edb374a",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-28ddabc39945bd80",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-ee1bf9d513737aef",
      "unit": 12,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-e43786427a239b5b",
      "unit": 12,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-fea28129ed875d7e",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-9a77ab2032850901",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-b26f6e00fc1417fe",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-026c3e85b68e2772",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-6b87dfdf9340ef98",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-d2937d958052ba17",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-e99a8e1a69ccf932",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-9caf062ab353d8bb",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-cb136c62208d59ad",
      "unit": 12,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-2f9ef4a9ff1df50a",
      "unit": 13,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-329990fe89eca04d",
      "unit": 13,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-b141fdd225e8df03",
      "unit": 13,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-a3b6818561592aae",
      "unit": 13,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-898343bc5172847f",
      "unit": 13,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-f948023738634001",
      "unit": 13,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-1f0ddb5bcc56fd2d",
      "unit": 13,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-bddb27a01d4ae7ed",
      "unit": 13,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-5298829dcbb1d5dc",
      "unit": 13,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-83f3032581a21a6f",
      "unit": 13,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-0745656126e11de2",
      "unit": 13,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-08244f933aa31b5f",
      "unit": 13,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-9dc635bb79cb8090",
      "unit": 13,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-b6a1dd1648960f54",
      "unit": 13,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-773a4ae52c4795d7",
      "unit": 13,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-359549e4b6fedd8d",
      "unit": 13,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-746e5718a88979f5",
      "unit": 13,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-9232fd7cc7e0986f",
      "unit": 13,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-7e9e13e83a06b47d",
      "unit": 13,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-c1a154f4be5b3d82",
      "unit": 13,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-5b4f82419b87e689",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-19731ef0f018e315",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-4dba4e0b469742ed",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-438909d67a7b63d8",
      "unit": 14,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-99503cf8a4795c73",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-fda6f0a262ed853e",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-a81ab4ea1e84e031",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-5ec80cf8e9d3bcf4",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-dbae7d81faa5042b",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-251fcfe4fccaeda9",
      "unit": 14,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-c55c51ada6b3e689",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-f0de50a9d256e378",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-0ed87ccbc3d3cbb8",
      "unit": 14,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-ea9da77739c2a57b",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-032e017ca23ff0b9",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-3ad89c5153c0ab7b",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-39db0448af01d90e",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-49e2bcb736301a66",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-e0a08f93a2b0b840",
      "unit": 14,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-5335583b2d85fc88",
      "unit": 14,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-bfc6277030d59994",
      "unit": 15,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-1dd01f69058c731c",
      "unit": 15,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-9c27e64328a7e16e",
      "unit": 15,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-68c6175d3062946b",
      "unit": 15,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-2ccb7747f277243b",
      "unit": 15,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-5462b5763f41d724",
      "unit": 15,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-1583279dcc69f9fa",
      "unit": 15,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-67956ade627bc2ee",
      "unit": 15,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-bd27226860f2dc86",
      "unit": 15,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-fdd8b78d15476d07",
      "unit": 15,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-1d4c3d7e6d8566f6",
      "unit": 15,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-a8733bccbc4defa8",
      "unit": 15,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-ec067c1b0939c325",
      "unit": 15,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-53a4dc8880956939",
      "unit": 15,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-d767449b4fee4a5d",
      "unit": 15,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-d716e51a8b2a8074",
      "unit": 15,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-a50232e497fc50ae",
      "unit": 15,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-1f3ef556f1a02b2c",
      "unit": 15,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-1ae7f42570523338",
      "unit": 15,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-8b331ac281685931",
      "unit": 15,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-e5f7b70fdefd8946",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-e52441cc2824630c",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-354c9cc416c65eeb",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-37e6a822e9dd1c92",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-07ae5a7cac257af1",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-ba0484aacdaff471",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-d555b279df9e9089",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-fa64e2f1831501dd",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-6ec26c2cd9d33d37",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-618c9ab3657f1cd9",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-b119c6c54892df1d",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-6bc81074553ebbd4",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-99573e5f84c33adc",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-cf45ffb142fd7cd4",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-a509afde0c01e9bd",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-f387747279044c36",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-82c0285d71d32a98",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-f0d5269b4c63b2ae",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-5153a1a2bc45b4aa",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-987e47a719cc0e6b",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-2a704ac408deaebd",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-ba95a15994305f2d",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-0843db1ab490433e",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-8080ed7d98e92791",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-62d9a336c766322b",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-ecd6176644555125",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-5d27c1e5c4d915b2",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-e5e31c7e6acf01fa",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-687870c7629b15f9",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-230bfdd1b1441d45",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-45ab00975d2fd7f0",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-bf81e6ca34099064",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-b54219c0e06679d1",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-20c1cdd75d04b2e8",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-bb9e4b338ff1918a",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-95220356fb1760d0",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-d1e4fc041609fa07",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-a1454a0ec34ef275",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-555abc26c66470af",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-e14e2fcb8ca92326",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-cf8ed655827efb84",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-80f96d8fdffbd81e",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-75ffb5cca86f0da6",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-a88c431d18bc8df8",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-86d46fd78e5122f5",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-c33438e25c8eb7da",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-fc480e14e8076ce2",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-a6d78edf0ecfef7a",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-b8f96959fc85ef9c",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-2016b756271df011",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-57a30444f4ff915b",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-ffa5b084447f4179",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-88f991e4f218854f",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-4dd363edfb2437f8",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-64468ce4ca350427",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-b4422874e0f966be",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-3ebac3b22601c231",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-cfab8d03111f2bc7",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-d342247ee1e68e8d",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-0a98ffb19358aa3a",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-35a06cbbc58cb6cf",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-95be87cbd5fbd4a8",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-a4675d34c55ba849",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-b0ed6799c027477d",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-e3992eb8fe43db1e",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-6c79fce8b9b0d8ff",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-d5750338a0e4655b",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-e401e0eba604e0a4",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-9bf2f0543128b489",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-0e911e4c8c1b9cd6",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-e53870f56986abb0",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-2b7fd818dac2334a",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-d26341335156964e",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-54fcdf42c33eb5fa",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-bf9450bbfd4690bb",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-94c8651b94e1822b",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-f3d48dc5c03d09b1",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-1ac3e46e9522f935",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-ed40ce5ff8a7d006",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-48226ec251ff07fa",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-a80ad83b23b62b85",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-af2dd40ec0303670",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-6bb057c637c6fd9e",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-85213c6deef78dba",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-0fed590793f0dab6",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-4ec0d5a45d5d902a",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-c63b9ca630e4339a",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-180123d4da1b026d",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-736b29956d692cba",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-acd3b793b20e252a",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-00ec011d49979290",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-ede38f500ce6a51a",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-352258bea3479760",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-01312bb92a773940",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-f8276d0aabf7ae4c",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-02ba4fa16c69d682",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-5685e33a29e256c5",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-c5a8a80213b0a16e",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-628c8c046691ac6b",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-c0ad003542bfc0ef",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-6afc2798981d9961",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-1eafa527334bf7fb",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-57d9239b9d78bd60",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-3ebf3e66d3bc4369",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-b4c14336f7987720",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-73882fa44a50e62d",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-5f77ba90b41e96c9",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-f3fbdb9cf2811287",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-4c8aa653ae390ca3",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-6e683a819d46266c",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-bb4efe47e9fb69c0",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-3485b722732eaa3c",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-0e5d9e22b5f25ad1",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-a0798a9355fc9730",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-e39e635f2c00c6c7",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-081f4c080a096e3c",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-aa0a51a65ccfb80e",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-13a42b244b518f27",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-271d599b31e56ac1",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-7eab7814c67f3556",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-70b04df6ae634595",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-c76aaa0b5fa81d2a",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-776f09b52c4907cb",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-b4f876e8b773488e",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-6c8ba956f2d3913f",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-89738763eb8addd5",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-da37b248cd1f063a",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-8e6bdacb634d4d3a",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-9f36c340295f9562",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-3473bf2d347f204c",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-9a2a437fcf253a79",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-00e378b9343b8ee7",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-40afc70b38c92bf3",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-11b9bd61b3279af9",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-d5e44201d170df56",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-91b3ba829c2c7738",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-041efecc45d40089",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-3eaa593eb3901020",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-e8de92153512a4db",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-08dcd7b51d2dce4e",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-6c8c90a3b1ddab0b",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-907ec53d885787e7",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-56a8af04f482e62f",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-2ce1168964034a18",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-b2818f985d3f2fb3",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-6998d29e454e9e17",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-178cb5cd060eab19",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-c00a3fc5a9dc61e7",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-2944921d8c330caa",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-73028800c94439c6",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-e2c1c64bd8ed697c",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-408e4ad00a7e4597",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-1ed50cce013046fa",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-2d9adac424ada51e",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-bc155a39d50e5ffd",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-dc6d9b20de315780",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-ed1dd684380c77b1",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-56121fb0f86f8651",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-c5aab6c7cc1a5bd3",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-0043fb7506175692",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-9b082c8ed427004d",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-3b2da50d2e63fed1",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-04eddee1352a19aa",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-84adddf27de97cbd",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-0158dfbad6939385",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-c3dd8af3e4f747d7",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-c5c0f6988632c310",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-0b139ecbb6f06162",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-18f947270bce829a",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-541002339abb6d4e",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-e3f29a9bf179bfc1",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-a3527e2475e90c60",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-26f1a577c0fbff74",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-3fa58d7f7ddd272f",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-578b7ac227814ce9",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-ea8948a52fa5bf4b",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-4419cbf830ceda74",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-08bc963b4c6653b9",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-0602313aabd01ef9",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-4e22f1f612d653ab",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-8f1e6acf1ac7500a",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-f3e9a7b97f34fa1f",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-b155f088c2470d2c",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-bcd66bc3d5391efe",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-a60e7ddd1b4ec6df",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-20af4edd0e65a5d5",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-36cce721a8d04f17",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-dfc19df591de0bd2",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-5c7278c5d7dcd320",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-3c309a282d842f40",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-c9159c7a8bfa762e",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-63b3fab96f60c9db",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-6f52480e31787f11",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    },
    {
      "id": "garden-152d7c96662371f4",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-1c9f8e9b6f2be17e",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-e7f7691e8311c065",
      "unit": 16,
      "givens": [],
      "difficulty": 3
    },
    {
      "id": "garden-e3b9bcf701925e98",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-3e74783028cc951d",
      "unit": 16,
      "givens": [],
      "difficulty": 4
    },
    {
      "id": "garden-469d93912d1a4b05",
      "unit": 16,
      "givens": [],
      "difficulty": 2
    },
    {
      "id": "garden-d3dd271802a02169",
      "unit": 16,
      "givens": [],
      "difficulty": 5
    }
  ]
};
// Original ratings are frozen; the new pack uses measured deductions from rate-level.cjs.
// Use append-200.cjs for this expansion: level ids are content hashes; dropping or
// reorders an id silently moves a player's progress. `start` is informational only; the order in
// `levels` is the order the player walks.
const UNIT_IDS=new Set(config.units.map(u=>u.id));
config.levels.forEach(entry=>{if(!UNIT_IDS.has(entry.unit))throw Error('关卡 '+entry.id+' 指向不存在的单元 '+entry.unit);});
function arrange(levels){const byId=new Map(levels.map(l=>[l.id,l]));return [...config.levels.flatMap(c=>byId.has(c.id)?[byId.get(c.id)]:[]),...levels.filter(l=>!config.levels.some(c=>c.id===l.id))];}
function forLevel(level){const entry=config.levels.find(c=>c.id===level.id);const expansion=level.expansion;const pack=expansion?.pack==='more-100-20261004'&&Number.isInteger(expansion.group)&&expansion.group>=1&&expansion.group<=5?10+expansion.group:null;const unit=pack!==null&&config.units.some(u=>u.id===pack)?pack:1;return entry||{id:level.id,unit,givens:[],difficulty:3};}
function startBoard(level){const given=forLevel(level).givens;return Array.from({length:level.size**2},(_,i)=>given.includes(i)?2:0);}
function unitFor(level){return config.units.find(u=>u.id===forLevel(level).unit)||config.units[1];}
// Difficulty uses the existing 2-5 scale. The new pack is rated by required deductions;
// existing ratings stay unchanged. Unrated external levels fall back to the middle.
function difficultyFor(level){const value=forLevel(level).difficulty;return Number.isInteger(value)&&value>=2&&value<=5?value:3;}
const DIFFICULTY_TEXT={2:'轻松',3:'适中',4:'偏难',5:'很难'};
// Completed ids that no longer match a level are kept in `stale` instead of being dropped. Garden
// level ids are content hashes, so regenerating the level data would otherwise erase a player's
// history without a trace; `completed` still counts only live levels, so the readouts stay honest.
function validProgress(raw,levels){
  const ids=new Set(levels.map(l=>l.id));
  const done=(Array.isArray(raw?.completed)?raw.completed:[]).filter(id=>typeof id==='string'||typeof id==='number');
  return{
    completed:[...new Set(done.filter(id=>ids.has(id)))],
    learned:[...new Set((Array.isArray(raw?.learned)?raw.learned:[]).filter(id=>UNIT_IDS.has(id)))],
    stale:[...new Set([...done,...(Array.isArray(raw?.stale)?raw.stale:[])].filter(id=>(typeof id==='string'||typeof id==='number')&&!ids.has(id)))],
    skills:{seen:[...new Set((Array.isArray(raw?.skills?.seen)?raw.skills.seen:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<16))],practiced:[...new Set((Array.isArray(raw?.skills?.practiced)?raw.skills.practiced:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<16))]},
    current:ids.has(raw?.current)?raw.current:levels[0].id
  };
}
const api={config,arrange,forLevel,startBoard,unitFor,difficultyFor,DIFFICULTY_TEXT,validProgress};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CatJourney=api;
})(typeof globalThis!=='undefined'?globalThis:this);

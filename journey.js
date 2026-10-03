/* Unit pacing and starter cats for the original 55 puzzles. */
(function(root){'use strict';
const config={
  "units": [
    {
      "name": "初次见面",
      "tag": "单击标叉 · 双击放猫",
      "count": 2,
      "cap": 1,
      "lessons": [
        0,
        1
      ],
      "id": 0,
      "start": 0
    },
    {
      "name": "轻轻划过",
      "tag": "按住拖动 · 批量排除",
      "count": 2,
      "cap": 1,
      "lessons": [
        2
      ],
      "id": 1,
      "start": 2
    },
    {
      "name": "留一点距离",
      "tag": "周围八格 · 斜角也算",
      "count": 3,
      "cap": 1,
      "lessons": [
        3
      ],
      "id": 2,
      "start": 4
    },
    {
      "name": "唯一的家",
      "tag": "同一种颜色只剩一格",
      "count": 4,
      "cap": 1,
      "lessons": [
        4
      ],
      "id": 3,
      "start": 7
    },
    {
      "name": "横竖找一找",
      "tag": "一行或一列只剩一格",
      "count": 5,
      "cap": 1,
      "lessons": [
        5,
        6
      ],
      "id": 4,
      "start": 11
    },
    {
      "name": "颜色有边界",
      "tag": "一种颜色锁定一行或一列",
      "count": 6,
      "cap": 2,
      "lessons": [
        7,
        8
      ],
      "id": 5,
      "start": 16
    },
    {
      "name": "换个方向想",
      "tag": "行列反过来锁定颜色",
      "count": 7,
      "cap": 3,
      "lessons": [
        9
      ],
      "id": 6,
      "start": 22
    },
    {
      "name": "成双的线索",
      "tag": "两行、两列与两种颜色",
      "count": 8,
      "cap": 4,
      "lessons": [
        10,
        11
      ],
      "id": 7,
      "start": 29
    },
    {
      "name": "大胆试，小心退",
      "tag": "假设反证 · 保留退路",
      "count": 8,
      "cap": 6,
      "lessons": [
        12,
        13
      ],
      "id": 8,
      "start": 37
    },
    {
      "name": "自由探索",
      "tag": "综合挑战 · 按需提示",
      "count": 10,
      "cap": 6,
      "lessons": [
        14
      ],
      "id": 9,
      "start": 45
    }
  ],
  "levels": [
    {
      "id": "garden-a2e4f5b129c094cf",
      "unit": 0,
      "givens": [
        1,
        8,
        10,
        19
      ]
    },
    {
      "id": "garden-25310f102bd2b40d",
      "unit": 0,
      "givens": [
        4,
        6,
        13,
        15
      ]
    },
    {
      "id": "garden-091b6df0cb6d8622",
      "unit": 1,
      "givens": []
    },
    {
      "id": "garden-7827347e0d68b988",
      "unit": 1,
      "givens": [
        4
      ]
    },
    {
      "id": "garden-dc131cc6cbc193e2",
      "unit": 2,
      "givens": [
        0,
        7
      ]
    },
    {
      "id": "garden-3457b7b792135f0e",
      "unit": 2,
      "givens": [
        3
      ]
    },
    {
      "id": "garden-2e463ae8f9bc2e52",
      "unit": 2,
      "givens": [
        3
      ]
    },
    {
      "id": "garden-055afbee7f871eed",
      "unit": 3,
      "givens": [
        0,
        7
      ]
    },
    {
      "id": "window",
      "unit": 3,
      "givens": [
        1,
        9
      ]
    },
    {
      "id": "garden-a31ab9484050ff4a",
      "unit": 3,
      "givens": [
        1
      ]
    },
    {
      "id": "garden-de2560a1e675444d",
      "unit": 3,
      "givens": [
        0,
        7
      ]
    },
    {
      "id": "yard",
      "unit": 4,
      "givens": [
        2
      ]
    },
    {
      "id": "garden-ff83edc4f56f702b",
      "unit": 4,
      "givens": [
        0,
        9,
        13
      ]
    },
    {
      "id": "garden-3be8d54661fd20dd",
      "unit": 4,
      "givens": [
        0,
        8
      ]
    },
    {
      "id": "garden-1eec98707609e75c",
      "unit": 4,
      "givens": [
        4
      ]
    },
    {
      "id": "garden-fb2dd415d6ae15fb",
      "unit": 4,
      "givens": [
        5,
        7
      ]
    },
    {
      "id": "garden-cf97c8daccb30660",
      "unit": 5,
      "givens": [
        4,
        8,
        17,
        19
      ]
    },
    {
      "id": "garden-34d56e67bd11de16",
      "unit": 5,
      "givens": [
        5,
        9
      ]
    },
    {
      "id": "garden-b50142e7b974d5ac",
      "unit": 5,
      "givens": [
        1,
        9
      ]
    },
    {
      "id": "garden-98eb04af57dca091",
      "unit": 5,
      "givens": [
        2
      ]
    },
    {
      "id": "garden-2a033cb4756635b6",
      "unit": 5,
      "givens": [
        0,
        10,
        14
      ]
    },
    {
      "id": "garden-d417a67d879ee5d3",
      "unit": 5,
      "givens": [
        1
      ]
    },
    {
      "id": "garden-7cd24b1aa847aa25",
      "unit": 6,
      "givens": []
    },
    {
      "id": "roof",
      "unit": 6,
      "givens": []
    },
    {
      "id": "garden-9e6f8cccb0db3819",
      "unit": 6,
      "givens": []
    },
    {
      "id": "garden-4737375cf5501ab6",
      "unit": 6,
      "givens": []
    },
    {
      "id": "garden-f0326c0d5cd0de9c",
      "unit": 6,
      "givens": []
    },
    {
      "id": "garden-04445c8fedb1ac63",
      "unit": 6,
      "givens": []
    },
    {
      "id": "garden-b15e5107d941c85a",
      "unit": 6,
      "givens": [
        0,
        12,
        15,
        24
      ]
    },
    {
      "id": "garden-f5c3bf2ce9d706fc",
      "unit": 7,
      "givens": [
        2,
        7
      ]
    },
    {
      "id": "garden-058f329fbf0af807",
      "unit": 7,
      "givens": [
        2,
        11,
        20
      ]
    },
    {
      "id": "garden-5f498ac8e49b7404",
      "unit": 7,
      "givens": [
        4,
        13,
        17
      ]
    },
    {
      "id": "garden-3e4c609c58a3625c",
      "unit": 7,
      "givens": [
        0,
        12,
        17,
        27,
        30
      ]
    },
    {
      "id": "garden-c054590132eeaff4",
      "unit": 7,
      "givens": []
    },
    {
      "id": "garden-8e1e1ba86fa9c046",
      "unit": 7,
      "givens": []
    },
    {
      "id": "garden-8505e8c2a3c17da4",
      "unit": 7,
      "givens": []
    },
    {
      "id": "garden-fa4500de172e184b",
      "unit": 7,
      "givens": []
    },
    {
      "id": "garden-60b622df826f1f96",
      "unit": 8,
      "givens": []
    },
    {
      "id": "garden-297799ce663833fe",
      "unit": 8,
      "givens": []
    },
    {
      "id": "garden-e0ba14421c94e43b",
      "unit": 8,
      "givens": []
    },
    {
      "id": "garden-9abb69824e258e7d",
      "unit": 8,
      "givens": []
    },
    {
      "id": "garden-77416539431c2ee2",
      "unit": 8,
      "givens": []
    },
    {
      "id": "moon",
      "unit": 8,
      "givens": [
        6,
        8,
        23,
        29,
        35
      ]
    },
    {
      "id": "garden-1dbc32e36cdd69e8",
      "unit": 8,
      "givens": [
        4,
        14,
        17
      ]
    },
    {
      "id": "garden-a5e79fac812aab64",
      "unit": 8,
      "givens": []
    },
    {
      "id": "garden-4747d5d13c42d804",
      "unit": 9,
      "givens": []
    },
    {
      "id": "garden-37f7a7b9b2ccb6f3",
      "unit": 9,
      "givens": []
    },
    {
      "id": "garden-ba5bc6aa41efa8f1",
      "unit": 9,
      "givens": []
    },
    {
      "id": "garden-bc7b3b1bc504c500",
      "unit": 9,
      "givens": []
    },
    {
      "id": "garden-cc0529bba9389734",
      "unit": 9,
      "givens": []
    },
    {
      "id": "garden-cd721a078ad43be4",
      "unit": 9,
      "givens": []
    },
    {
      "id": "garden-4d77f8c659dcf3fd",
      "unit": 9,
      "givens": []
    },
    {
      "id": "garden-3a974caa82a3c19b",
      "unit": 9,
      "givens": []
    },
    {
      "id": "garden-efa8d73edcefe3a2",
      "unit": 9,
      "givens": []
    },
    {
      "id": "stars",
      "unit": 9,
      "givens": [
        2,
        13,
        19,
        30,
        36,
        52
      ]
    }
  ]
};
// User-supplied test boards stay outside the paced learning route and always start empty.
config.units.push({id:10,name:'截图测试',tag:'按原截图还原 · 全部从空盘开始',count:7,cap:6,lessons:[],start:55,testPack:true});
for(const number of [89,81,80,79,78,75,74])config.levels.push({id:'screenshot-'+number,unit:10,givens:[]});
for(let group=1;group<=5;group++)config.units.push({id:10+group,name:'百关挑战 · 第 '+group+' 组',tag:[7,8,8,9,9][group-1]+' × '+[7,8,8,9,9][group-1]+' · 空盘自由推理',count:20,cap:6,lessons:[],start:62+(group-1)*20,extraPack:true});
config.levels.forEach(entry=>{if(entry.unit>=8)entry.givens=[];});
function arrange(levels){const byId=new Map(levels.map(l=>[l.id,l]));return [...config.levels.flatMap(c=>byId.has(c.id)?[byId.get(c.id)]:[]),...levels.filter(l=>!config.levels.some(c=>c.id===l.id))];}
function forLevel(level){const entry=config.levels.find(c=>c.id===level.id);const expansion=level.expansion;return entry||{id:level.id,unit:expansion?.pack==='more-100-20261004'&&Number.isInteger(expansion.group)&&expansion.group>=1&&expansion.group<=5?10+expansion.group:9,givens:[]};}
function startBoard(level){const given=forLevel(level).givens;return Array.from({length:level.size**2},(_,i)=>given.includes(i)?2:0);}
function unitFor(level){return config.units[forLevel(level).unit];}
function validProgress(raw,levels){const ids=new Set(levels.map(l=>l.id));return{completed:[...new Set((Array.isArray(raw?.completed)?raw.completed:[]).filter(id=>ids.has(id)))],learned:[...new Set((Array.isArray(raw?.learned)?raw.learned:[]).filter(id=>Number.isInteger(id)&&id>=0&&id<config.units.length))],current:ids.has(raw?.current)?raw.current:levels[0].id};}
const api={config,arrange,forLevel,startBoard,unitFor,validProgress};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CatJourney=api;
})(typeof globalThis!=='undefined'?globalThis:this);

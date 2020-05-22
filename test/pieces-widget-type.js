const t = require('../test-lib/test.js');
const assert = require('assert');

describe('Pieces Widgets', function() {

  let apos;

  this.timeout(t.timeout);

  after(async function() {
    return t.destroy(apos);
  });

  // EXISTENCE

  it('should initialize', async function() {
    apos = await t.create({
      root: module,
      modules: {
        'events': {
          extend: '@apostrophecms/piece-type',
          options: {
            name: 'event',
            label: 'Event',
            alias: 'events',
            sort: { title: 1 }
          }
        },
        'events-widgets': {
          extend: '@apostrophecms/pieces-widget-type'
        },
        'default-pages': {
          extend: '@apostrophecms/page-type',
          options: {
            name: 'default'
          },
          fields: {
            add: {
              body: {
                type: 'area',
                options: {
                  widgets: {
                    'events': {}
                  }
                }
              }
            }
          }
        },
        '@apostrophecms/pages': {
          options: {
            types: [
              {
                name: 'home',
                label: 'Home'
              },
              {
                name: 'default',
                label: 'Default'
              }
            ],
            park: [
              {
                title: 'Page With Events Widget',
                metaType: 'doc',
                type: 'default',
                slug: '/page-with-events',
                parkedId: 'page-with-events-widget',
                published: true,
                body: {
                  metaType: 'area',
                  items: [
                    {
                      metaType: 'widget',
                      type: 'events',
                      by: 'id',
                      pieceIds: [
                        'wevent010', 'wevent011', 'wevent012'
                      ]
                    },
                    {
                      metaType: 'widget',
                      type: 'events',
                      by: 'all',
                      limitAll: 5
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    });
  });

  it('should be able to use db to insert test pieces', async function() {
    assert(apos.modules['events-widgets']);
    let testItems = [];
    let total = 100;
    for (let i = 1; (i <= total); i++) {
      let paddedInt = apos.launder.padInteger(i, 3);
      let title = 'Event ' + paddedInt;
      testItems.push({
        _id: 'wevent' + paddedInt,
        slug: 'wevent-' + paddedInt,
        published: true,
        metaType: 'doc',
        type: 'event',
        title: title,
        body: {
          metaType: 'area',
          items: [
            {
              metaType: 'widget',
              type: '@apostrophecms/rich-text',
              content: '<p>This is some content.</p>'
            }
          ]
        }
      });
    }

    // We need an event that can be distinguished by
    // something other than a number in order to test
    // our autocomplete, which feeds through mongo's text
    // indexes, which don't support numbers
    const paddedInt = 'wiggly';
    const title = 'Event Wiggly';
    testItems.push({
      _id: 'weventwiggly' + paddedInt,
      slug: 'wevent-wiggl' + paddedInt,
      published: true,
      metaType: 'doc',
      type: 'event',
      title: title,
      // fake highSearchText and highSearchWords until the
      // search module is finished
      highSearchText: apos.utils.sortify(title),
      highSearchWords: apos.utils.sortify(title).split(/ /),
      body: {
        metaType: 'area',
        items: [
          {
            metaType: 'widget',
            type: '@apostrophecms/rich-text',
            content: '<p>This is some content.</p>'
          }
        ]
      }
    });
    const req = apos.tasks.getReq();
    for (const item of testItems) {
      await apos.docs.insert(req, item);
    }
  });

  it('should find appropriate events and not others in a page containing all and id-based event widgets', async function() {

    const body = await apos.http.get('/page-with-events');
    // Does it contain the right events via a widget?
    assert(body.match(/Event 005/));
    assert(body.match(/Event 006/));
    assert(body.match(/Event 007/));

    // Are they in the right order (reversed on purpose)?
    let i5 = body.indexOf('Event 005');
    let i6 = body.indexOf('Event 006');
    let i7 = body.indexOf('Event 007');
    assert((i5 > i6) && (i6 > i7));

    // These are by all
    assert(body.match(/Event 001/));
    assert(body.match(/Event 002/));
    assert(body.match(/Event 003/));
    assert(body.match(/Event 004/));
    assert(body.match(/Event 005/));

    // Respect limit by all
    assert(!body.match(/Event 006/));
  });

});

describe('Pieces Widget With Extra Join', function() {

  let apos;

  this.timeout(t.timeout);

  after(async function() {
    return t.destroy(apos);
  });

  // EXISTENCE

  it('should initialize', async function() {
    apos = await t.create({
      root: module,
      modules: {
        'events': {
          extend: '@apostrophecms/piece-type',
          options: {
            name: 'event',
            label: 'Event',
            alias: 'events',
            sort: { title: 1 }
          }
        },
        'events-widgets': {
          extend: '@apostrophecms/pieces-widget-type',
          fields: {
            add: {
              _featured: {
                type: 'joinByArray',
                withType: 'event'
              }
            }
          }
        },
        '@apostrophecms/pages': {
          options: {
            types: [
              {
                name: 'home',
                label: 'Home'
              },
              {
                name: 'default',
                label: 'Default'
              }
            ],
            park: [
              {
                title: 'Page With Events Widget',
                type: 'default',
                slug: '/page-with-events',
                published: true,
                parkedId: 'page-with-events-widget',
                body: {
                  metaType: 'area',
                  items: [
                    {
                      metaType: 'widget',
                      type: 'events',
                      by: 'id',
                      pieceIds: [
                        'wevent010', 'wevent011', 'wevent012'
                      ],
                      featuredIds: [
                        'wevent020', 'wevent021'
                      ]
                    },
                    {
                      metaType: 'widget',
                      type: 'events',
                      by: 'all',
                      limitByAll: 5
                    }
                  ]
                }
              }
            ]
          }
        },
        'default-pages': {
          extend: '@apostrophecms/page-type',
          options: {
            name: 'default'
          },
          fields: {
            add: {
              body: {
                type: 'area',
                options: {
                  widgets: {
                    'events': {}
                  }
                }
              }
            }
          }
        }
      }
    });
  });

  it('should be able to use db to insert test pieces', async function() {
    assert(apos.modules['events-widgets']);
    let testItems = [];
    let total = 100;
    for (let i = 1; (i <= total); i++) {
      let paddedInt = apos.launder.padInteger(i, 3);
      let title = 'Event ' + paddedInt;
      testItems.push({
        _id: 'wevent' + paddedInt,
        slug: 'wevent-' + paddedInt,
        published: true,
        type: 'event',
        title: title,
        body: {
          metaType: 'area',
          items: [
            {
              metaType: 'widget',
              type: '@apostrophecms/rich-text',
              content: '<p>This is some content.</p>'
            }
          ]
        }
      });
    }

    // We need an event that can be distinguished by
    // something other than a number in order to test
    // our autocomplete, which feeds through mongo's text
    // indexes, which don't support numbers
    const paddedInt = 'wiggly';
    const title = 'Event Wiggly';
    testItems.push({
      _id: 'weventwiggly' + paddedInt,
      slug: 'wevent-wiggl' + paddedInt,
      published: true,
      type: 'event',
      title: title,
      // fake highSearchText and highSearchWords until the
      // search module is finished
      highSearchText: apos.utils.sortify(title),
      highSearchWords: apos.utils.sortify(title).split(/ /),
      body: {
        metaType: 'area',
        items: [
          {
            metaType: 'widget',
            type: '@apostrophecms/rich-text',
            content: '<p>This is some content.</p>'
          }
        ]
      }
    });
    let req = apos.tasks.getReq();
    for (const item of testItems) {
      await apos.docs.insert(req, item);
    }
  });

  it('should find appropriate events and not others in a page containing all and id-based event widgets', async function() {

    const body = await apos.http.get('/page-with-events');
    // Does it contain the right events via a widget?
    assert(body.match(/Event 010/));
    assert(body.match(/Event 011/));
    assert(body.match(/Event 012/));

    // Are they in the right order (reversed on purpose)?
    let i10 = body.indexOf('Event 010');
    let i11 = body.indexOf('Event 011');
    let i12 = body.indexOf('Event 012');
    assert((i10 > i11) && (i11 > i12));

    // These are by all
    assert(body.match(/Event 001/));
    assert(body.match(/Event 002/));
    assert(body.match(/Event 003/));
    assert(body.match(/Event 004/));
    assert(body.match(/Event 005/));

    // Respect limit by all
    assert(!body.match(/Event 006/));

    // Does it contain events not associated with the widgets?
    assert(!body.match(/Event 040/));

    // Does it contain the featured events in the extra join?
    assert(body.match(/Event 020/));
    assert(body.match(/Event 021/));
    let i20 = body.indexOf('Event 020');
    let i21 = body.indexOf('Event 021');
    // Are they in the right order and in the right place (before the regular stuff)?
    assert(i20 < i10);
    assert(i21 < i10);
  });

});

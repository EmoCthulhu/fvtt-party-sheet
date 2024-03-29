/* eslint-disable no-undef */
// @ts-ignore
export class PartySheetCreatorForm extends FormApplication {
  constructor({ actor_types, inspect_objects = {} }) {
    super();
    this.base_inspect_objects = inspect_objects;
    this.inspect_objects = inspect_objects;
    this.actor_types = actor_types;
    this.currentFocusItem = null;
  }

  // eslint-disable-next-line no-unused-vars
  _updateObject(event, formData) {
    // @ts-ignore
    console.log("Updating object");
  }

  getData(options) {
    // @ts-ignore
    return mergeObject(super.getData(options), {
      coreItems: this.inspect_objects,
      actorTypes: this.actor_types,
    });
  }

  static get defaultOptions() {
    // @ts-ignore
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "fvtt-party-sheet-creator",
      classes: ["form"],
      title: "Party Sheet Creator",
      template: "modules/fvtt-party-sheet/templates/party-sheet-creator.hbs",
      // @ts-ignore
      // eslint-disable-next-line no-undef
      width: $(window).width() > 960 ? 960 : $(window).width() - 100,
      // @ts-ignore
      // eslint-disable-next-line no-undef
      height: $(window).height() > 800 ? 800 : $(window).height() - 100,
    });
  }

  closeWindow() {
    // @ts-ignore
    this.close();
  }

  activateListeners(html) {
    super.activateListeners(html);

    // @ts-ignore
    $('div[class="dd-item"]', html).click(this.handleFocusItemClick.bind(this));
  }

  handleFocusItemClick(event) {
    // @ts-ignore
    const itemkey = event.currentTarget.dataset.itemkey;

    this.currentFocusItem = this.inspect_objects[itemkey];
    console.log("grabbed ");
    console.log(this.currentFocusItem);
    this.inspect_objects = this.currentFocusItem;
    // @ts-ignore
    this.render(true);
  }
}

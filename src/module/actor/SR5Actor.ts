import {Helpers} from '../helpers';
import {SR5Item} from '../item/SR5Item';
import {FLAGS, SKILL_DEFAULT_NAME, SR, SYSTEM_NAME} from '../constants';
import {PartsList} from '../parts/PartsList';
import {SR5Combat} from "../combat/SR5Combat";
import {DataDefaults} from '../data/DataDefaults';
import {SkillFlow} from "./flows/SkillFlow";
import {SR5} from "../config";
import {CharacterPrep} from "./prep/CharacterPrep";
import {SR5ItemDataWrapper} from "../data/SR5ItemDataWrapper";
import {CritterPrep} from "./prep/CritterPrep";
import {SpiritPrep} from "./prep/SpiritPrep";
import {SpritePrep} from "./prep/SpritePrep";
import {VehiclePrep} from "./prep/VehiclePrep";
import {DocumentSituationModifiers} from "../rules/DocumentSituationModifiers";
import {SkillRules} from "../rules/SkillRules";
import {MatrixRules} from "../rules/MatrixRules";
import {ICPrep} from "./prep/ICPrep";
import {
    EffectChangeData
} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/effectChangeData";
import {InventoryFlow} from "./flows/InventoryFlow";
import {ModifierFlow} from "./flows/ModifierFlow";
import {TestCreator} from "../tests/TestCreator";
import {AttributeOnlyTest} from "../tests/AttributeOnlyTest";
import {RecoveryRules} from "../rules/RecoveryRules";
import ActorRollOptions = Shadowrun.ActorRollOptions;
import AttributeField = Shadowrun.AttributeField;
import SkillRollOptions = Shadowrun.SkillRollOptions;
import SkillField = Shadowrun.SkillField;
import LimitField = Shadowrun.LimitField;
import EdgeAttributeField = Shadowrun.EdgeAttributeField;
import VehicleStat = Shadowrun.VehicleStat;
import Attributes = Shadowrun.Attributes;
import Limits = Shadowrun.Limits;
import DamageData = Shadowrun.DamageData;
import TrackType = Shadowrun.TrackType;
import OverflowTrackType = Shadowrun.OverflowTrackType;
import NumberOrEmpty = Shadowrun.NumberOrEmpty;
import VehicleStats = Shadowrun.VehicleStats;
import ActorArmorData = Shadowrun.ActorArmorData;
import ConditionData = Shadowrun.ConditionData;
import Skills = Shadowrun.Skills;
import CharacterSkills = Shadowrun.CharacterSkills;
import SpiritActorData = Shadowrun.SpiritActorData;
import CharacterActorData = Shadowrun.CharacterActorData;
import SpriteActorData = Shadowrun.SpriteActorData;
import VehicleActorData = Shadowrun.VehicleActorData;
import CritterActorData = Shadowrun.CritterActorData;
import ICActorData = Shadowrun.ICActorData;
import MatrixData = Shadowrun.MatrixData;
import HostItemData = Shadowrun.HostItemData;
import MarkedDocument = Shadowrun.MarkedDocument;
import MatrixMarks = Shadowrun.MatrixMarks;
import InventoryData = Shadowrun.InventoryData;
import DamageType = Shadowrun.DamageType;
import PackActionName = Shadowrun.PackActionName;
import PackName = Shadowrun.PackName;
import ActionRollData = Shadowrun.ActionRollData;
import ActorAttribute = Shadowrun.ActorAttribute;
import ShadowrunActorDataData = Shadowrun.ShadowrunActorDataData;
import KnowledgeSkills = Shadowrun.KnowledgeSkills;
import ShadowrunItemData= Shadowrun.ShadowrunItemData
import { CombatRules } from '../rules/CombatRules';


/**
 * The general Shadowrun actor implementation, which currently handles all actor types.
 *
 * To easily access Actor.data without any typing issues us the SR5Actor.asCritter helpers.
 * They are set up in a way that will handle both error management and type narrowing.
 * Example:
 * <pre><code>
 *     const actor = game.actors.get('randomId');
 *     const critter = actor.asCritter();
 *     if (!critter) return;
 *     // critter.type === 'critter'
 *     // critter.system as CritterData
 * </code></pre>
 *
 */
export class SR5Actor extends Actor {
    // Default inventory name and label for when no other inventory has been created.
    defaultInventory: InventoryData = {
        name: 'Carried',
        label: 'SR5.Labels.Inventory.Carried',
        itemIds: []
    }
    // Catch all inventory for these use cases:
    // - When selected show all items across all inventories.
    // - When item is added to it, will show that item on all inventories.
    allInventories: InventoryData = {
        name: 'All',
        label: 'SR5.Labels.Inventory.All',
        itemIds: [],
        showAll: true
    }

    // Allow users to access to tests creation.
    tests: typeof TestCreator = TestCreator;

    // Add v10 type helper
    system: ShadowrunActorDataData; // TODO: foundry-vtt-types v10

    // Holds all operations related to this actors inventory.
    inventory: InventoryFlow;
    // Holds all operations related to fetching an actors modifiers.
    modifiers: ModifierFlow;

    // TODO: foundry-vtt-types v10. Allows for {system: ...} to be given without type error
    constructor(data, context?) {
        super(data, context);

        this.inventory = new InventoryFlow(this);
        this.modifiers = new ModifierFlow(this);
    }

    getOverwatchScore() {
        const os = this.getFlag(SYSTEM_NAME, 'overwatchScore');
        return os !== undefined ? os : 0;
    }

    async setOverwatchScore(value) {
        const num = parseInt(value);
        if (!isNaN(num)) {
            return this.setFlag(SYSTEM_NAME, 'overwatchScore', num);
        }
    }

    /**
     * General data preparation order.
     * Check base, embeddedEntities and derived methods (see super.prepareData implementation for order)
     * Only implement data preparation here that doesn't fall into the other three categories.
     */
    override prepareData() {
        super.prepareData();
    }

    /**
     *  Prepare base data. Be careful that this ONLY included data not in need for item access.
     *  Check Actor and ClientDocumentMixin.prepareData for order of data prep.
     *
     *  Shadowrun data preparation is separate from the actor entity see the different <>Prep classes like
     *  CharacterPrep
     */
    override prepareBaseData() {
        super.prepareBaseData();

        switch (this.type) {
            case 'character':
                //@ts-ignore // TODO: foundry-vtt-types v10
                CharacterPrep.prepareBaseData(this.system);
                break;
            case "critter":
                //@ts-ignore // TODO: foundry-vtt-types v10
                CritterPrep.prepareBaseData(this.system);
                break;
            case "spirit":
                //@ts-ignore // TODO: foundry-vtt-types v10
                SpiritPrep.prepareBaseData(this.system);
                break;
            case "sprite":
                //@ts-ignore // TODO: foundry-vtt-types v10
                SpritePrep.prepareBaseData(this.system);
                break;
            case "vehicle":
                //@ts-ignore // TODO: foundry-vtt-types v10
                VehiclePrep.prepareBaseData(this.system);
                break;
            case "ic":
                //@ts-ignore // TODO: foundry-vtt-types v10
                ICPrep.prepareBaseData(this.system);
                break;
        }
    }

    /**
     * prepare embedded entities. Check ClientDocumentMixin.prepareData for order of data prep.
     */
    override prepareEmbeddedDocuments() {
        // This will apply ActiveEffects, which is okay for modify (custom) effects, however add/multiply on .value will be
        // overwritten.
        super.prepareEmbeddedDocuments();

        // @ts-ignore
        // NOTE: Hello there! Should you ever be in need of calling the grand parents methods, maybe to avoid applyActiveEffects,
        //       look at this beautiful piece of software and shiver in it's glory.
        // ClientDocumentMixin(class {}).prototype.prepareEmbeddedDocuments.apply(this);
    }

    /**
     * Should some ActiveEffects need to be excluded from the general application, do so here.
     * @override
     */
    override applyActiveEffects() {
        // Shadowrun uses prepareDerivedData to calculate lot's of things that don't exist on the data model in full.
        // Errors during change application will stop that process and cause a broken sheet.
        try {
            super.applyActiveEffects();
        } catch (error) {
            console.error(`Shadowrun5e | Some effect changes could not be applied and might cause issues. Check effects of actor (${this.name}) / id (${this.id})`);
            console.error(error);
            ui.notifications?.error(`See browser console (F12): Some effect changes could not be applied and might cause issues. Check effects of actor (${this.name}) / id (${this.id})`);
        }
    }

    /**
     * prepare embedded entities. Check ClientDocumentMixin.prepareData for order of data prep.
     *
     * At the moment general actor data preparation has been moved to derived data preparation, due it's dependence
     * on prepareEmbeddedEntities and prepareEmbeddedItems for items modifying attribute values and more.
     */
    override prepareDerivedData() {
        super.prepareDerivedData();

        // General actor data preparation has been moved to derived data, as it depends on prepared item data.
        const itemDataWrappers = this.items.map((item) => new SR5ItemDataWrapper(item as unknown as ShadowrunItemData));
        switch (this.type) {
            case 'character':
                //@ts-ignore // TODO: foundry-vtt-types v10
                CharacterPrep.prepareDerivedData(this.system, itemDataWrappers);
                break;
            case "critter":
                //@ts-ignore // TODO: foundry-vtt-types v10
                CritterPrep.prepareDerivedData(this.system, itemDataWrappers);
                break;
            case "spirit":
                //@ts-ignore // TODO: foundry-vtt-types v10
                SpiritPrep.prepareDerivedData(this.system, itemDataWrappers);
                break;
            case "sprite":
                //@ts-ignore // TODO: foundry-vtt-types v10
                SpritePrep.prepareDerivedData(this.system, itemDataWrappers);
                break;
            case "vehicle":
                //@ts-ignore // TODO: foundry-vtt-types v10
                VehiclePrep.prepareDerivedData(this.system, itemDataWrappers);
                break;
            case "ic":
                //@ts-ignore // TODO: foundry-vtt-types v10
                ICPrep.prepareDerivedData(this.system, itemDataWrappers);
                break;
        }
    }

    /**
     * NOTE: This method is unused at the moment, keep it for future inspiration.
     */
    applyOverrideActiveEffects() {
        const changes = this.effects.reduce((changes: EffectChangeData[], effect) => {
            if (effect.data.disabled) return changes;

            // include changes partially matching given keys.
            return changes.concat(effect.data.changes
                .filter(change => change.mode === CONST.ACTIVE_EFFECT_MODES.OVERRIDE)
                .map(change => {
                    // @ts-ignore // Foundry internal code, duplicate doesn't like EffectChangeData
                    change = foundry.utils.duplicate(change);
                    // @ts-ignore
                    change.effect = effect;
                    change.priority = change.priority ?? (change.mode * 10);

                    return change;
                }));
        }, []);
        // Sort changes according to priority, in case it's ever needed.
        // @ts-ignore // a / b can't be null here...
        changes.sort((a, b) => a.priority - b.priority);

        for (const change of changes) {
            // @ts-ignore
            change.effect.apply(this, change);
        }
    }

    /**
     * A helper method to only apply a subset of keys instead of all.
     * @param partialKeys Can either be complete keys or partial keys
     */
    _applySomeActiveEffects(partialKeys: string[]) {
        const changes = this._reduceEffectChangesByKeys(partialKeys);
        this._applyActiveEffectChanges(changes);
    }


    /**
     * A helper method to apply a active effect changes collection (which might come from multiple active effects)
     * @param changes
     */
    _applyActiveEffectChanges(changes: EffectChangeData[]) {
        const overrides = {};

        for (const change of changes) {
            // @ts-ignore
            const result = change.effect.apply(this, change);
            if (result !== null) overrides[change.key] = result;
        }

        this.overrides = {...this.overrides, ...foundry.utils.expandObject(overrides)};
    }

    /**
     * Reduce all changes across multiple active effects that match the given set of partial keys
     * @param partialKeys Can either be complete keys or partial keys
     */
    _reduceEffectChangesByKeys(partialKeys: string[]): EffectChangeData[] {
        // Collect only those changes matching the given partial keys.
        const changes = this.effects.reduce((changes: EffectChangeData[], effect) => {
            if (effect.data.disabled) return changes;

            // include changes partially matching given keys.
            return changes.concat(effect.data.changes
                .filter(change => partialKeys.some(partialKey => change.key.includes(partialKey)))
                .map(change => {
                    // @ts-ignore // Foundry internal code, duplicate doesn't like EffectChangeData
                    change = foundry.utils.duplicate(change);
                    // @ts-ignore
                    change.effect = effect;
                    change.priority = change.priority ?? (change.mode * 10);

                    return change;
                }));
        }, []);
        // Sort changes according to priority, in case it's ever needed.
        // @ts-ignore // TODO: foundry-vtt-types v10
        changes.sort((a, b) => a.priority - b.priority);

        return changes;
    }

    /**
     * Some actors have skills, some don't. While others don't have skills but derive skill values from their ratings.
     */
    findActiveSkill(skillName?: string): SkillField | undefined {
        // Check for faulty to catch empty names as well as missing parameters.
        if (!skillName) return;

        // Handle legacy skills (name is id)
        const skills = this.getActiveSkills();
        const skill = skills[skillName];
        if (skill) return skill;

        // Handle custom skills (name is not id)
        return Object.values(skills).find(skill => skill.name === skillName);
    }

    findAttribute(id?: string): AttributeField | undefined {
        if (id === undefined) return;
        const attributes = this.getAttributes();
        if (!attributes) return;
        return attributes[id];
    }

    findVehicleStat(statName?: string): VehicleStat | undefined {
        if (statName === undefined) return;

        const vehicleStats = this.getVehicleStats();
        if (vehicleStats)
            return vehicleStats[statName];
    }

    findLimitFromAttribute(attributeName?: string): LimitField | undefined {
        if (attributeName === undefined) return undefined;
        const attribute = this.findAttribute(attributeName);
        if (!attribute?.limit) return undefined;
        return this.findLimit(attribute.limit);
    }

    findLimit(limitName?: string): LimitField | undefined {
        if (!limitName) return undefined;
        //@ts-ignore // TODO: foundry-vtt-types v10
        return this.system.limits[limitName];
    }

    getWoundModifier(): number {
        //@ts-ignore // TODO: foundry-vtt-types v10
        if (!("wounds" in this.system)) return 0;
        //@ts-ignore // TODO: foundry-vtt-types v10
        return -1 * this.system.wounds.value || 0;
    }

    /** Use edge on actors that have an edge attribute.
     *
     * NOTE: This doesn't only include characters but spirits, critters and more.
     */
    async useEdge(by: number = -1) {
        const edge = this.getEdge();
        if (edge && edge.value === 0) return;
        // NOTE: There used to be a bug which could lower edge usage below zero. Let's quietly ignore and reset. :)
        const usesLeft = edge.uses > 0 ? edge.uses : by * -1;

        const uses = Math.min(edge.value, usesLeft + by);

        // @ts-ignore
        await this.update({'data.attributes.edge.uses': uses});
    }

    getEdge(): EdgeAttributeField {
        //@ts-ignore // TODO: foundry-vtt-types v10
        return this.system.attributes.edge;
    }

    hasArmor(): boolean {
        //@ts-ignore // TODO: foundry-vtt-types v10
        return "armor" in this.system;
    }

    /**
     * Return 
     * @param damage 
     * @returns 
     */
    getArmor(damage?:DamageData): ActorArmorData {
        // Prepare base armor data.
        //@ts-ignore // TODO: foundry-vtt-types v10
        const armor = "armor" in this.system ? 
            //@ts-ignore // TODO: foundry-vtt-types v10
            foundry.utils.duplicate(this.system.armor) : 
            DataDefaults.actorArmorData();
        // Prepare damage to apply to armor.
        damage = damage || DataDefaults.damageData();

        Helpers.calcTotal(damage);
        Helpers.calcTotal(damage.ap);

        // Modify by penetration
        if (damage.ap.value !== 0)
            PartsList.AddUniquePart(armor.mod, 'SR5.AP', damage.ap.value);
                
        // Modify by element
        if (damage.element.value !== '') {
            const armorForDamageElement = armor[damage.element.value] || 0;
            if (armorForDamageElement > 0)
                PartsList.AddUniquePart(armor.mod, 'SR5.Element', armorForDamageElement);
        }
        
        Helpers.calcTotal(armor, {min: 0});

        return armor;
    }

    getMatrixDevice(): SR5Item | undefined {
        //@ts-ignore // TODO: foundry-vtt-types v10
        if (!("matrix" in this.system)) return;
        //@ts-ignore // TODO: foundry-vtt-types v10
        const matrix = this.system.matrix;
        if (matrix.device) return this.items.get(matrix.device);
    }

    getFullDefenseAttribute(): AttributeField | undefined {
        if (this.isVehicle()) {
            return this.findVehicleStat('pilot');
        } else if (this.isCharacter()) {
            const character = this.asCharacter();
            if (character) {
                //@ts-ignore // TODO: foundry-vtt-types v10
                let att = character.system.full_defense_attribute;
                if (!att) att = 'willpower';
                return this.findAttribute(att);
            }
        }
    }

    getEquippedWeapons(): SR5Item[] {
        return this.items.filter((item: SR5Item) => item.isEquipped() && item.isWeapon);
    }

    /**
     * Amount of recoil compensation this actor has available (without the weapon used).
     */
    get recoilCompensation(): number {
        if(!this.system.values.hasOwnProperty('recoil_compensation')) return 0;
        //@ts-ignore
        return this.system.values.recoil_compensation.value;
    }

    
    /**
     * Current recoil compensation with current recoil included.
     * 
     * @returns A positive number or zero.
    */
    get currentRecoilCompensation(): number {
        return Math.max(this.recoilCompensation - this.recoil, 0);
    }
    
    /**
     * Amount of progressive recoil this actor has accrued.
     */
    get recoil(): number {
        if(!this.system.values.hasOwnProperty('recoil')) return 0;
        //@ts-ignore
        return this.system.values.recoil.value;
    }

    getDeviceRating(): number {
        //@ts-ignore // TODO: foundry-vtt-types v10
        if (!("matrix" in this.system)) return 0;
        // @ts-ignore // parseInt does indeed allow number types.
        return parseInt(this.system.matrix.rating);
    }

    getAttributes(): Attributes {
        //@ts-ignore // TODO: foundry-vtt-types v10
        return this.system.attributes;
    }

    /**
     * Return the given attribute, no matter its source.
     *
     * For characters and similar this will only return their attributes.
     * For vehicles this will also return their vehicle stats.

     * @param name An attribute or other stats name.
     * @returns Note, this can return undefined. It is not typed that way, as it broke many things. :)
     */
    getAttribute(name: string): AttributeField {
        // First check vehicle stats, as they don't always exist.
        const stats = this.getVehicleStats();
        if (stats && stats[name]) return stats[name];

        // Second check general attributes.
        const attributes = this.getAttributes();
        return attributes[name];
    }

    getLimits(): Limits {
        //@ts-ignore // TODO: foundry-vtt-types v10
        return this.system.limits;
    }

    getLimit(name: string): LimitField {
        const limits = this.getLimits();
        return limits[name];
    }

    /** Return actor type, which can be different kind of actors from 'character' to 'vehicle'.
     *  Please check SR5ActorType for reference.
     */
    getType(): string {
        return this.type;
    }

    isCharacter(): boolean {
        return this.getType() === 'character';
    }

    isSpirit(): boolean {
        return this.getType() === 'spirit';
    }

    isSprite(): boolean {
        return this.getType() === 'sprite';
    }

    isVehicle() {
        return this.getType() === 'vehicle';
    }

    isGrunt() {
        //@ts-ignore // TODO: foundry-vtt-types v10
        if (!("is_npc" in this.system) || !("npc" in this.system)) return false;

        //@ts-ignore // TODO: foundry-vtt-types v10
        return this.system.is_npc && this.system.npc.is_grunt;
    }

    isCritter() {
        return this.getType() === 'critter';
    }

    isIC() {
        return this.getType() === 'ic';
    }

    /**
     * Determine if this actor is able to have natural damage recovery.
     * @returns true in case of possible natural recovery.
     */
    get hasNaturalRecovery(): boolean {
        return this.isCharacter() || this.isCritter();
    }

    getVehicleTypeSkillName(): string | undefined {
        //@ts-ignore // TODO: foundry-vtt-types v10
        if (!("vehicleType" in this.system)) return;

        //@ts-ignore // TODO: foundry-vtt-types v10
        switch (this.system.vehicleType) {
            case 'air':
                return 'pilot_aircraft';
            case 'ground':
                return 'pilot_ground_craft';
            case 'water':
                return 'pilot_water_craft';
            case 'aerospace':
                return 'pilot_aerospace';
            case 'walker':
                return 'pilot_walker';
            case 'exotic':
                return 'pilot_exotic_vehicle';
            default:
                return;
        }
    }

    getVehicleTypeSkill(): SkillField | undefined {
        if (!this.isVehicle()) return;

        const name = this.getVehicleTypeSkillName();
        return this.findActiveSkill(name);
    }

    get hasSkills(): boolean {
        return this.getSkills() !== undefined;
    }

    getSkills(): CharacterSkills {
        //@ts-ignore // TODO: foundry-vtt-types v10
        return this.system.skills;
    }

    getActiveSkills(): Skills {
        //@ts-ignore // TODO: foundry-vtt-types v10
        return this.system.skills.active;
    }

    /**
     * Determine if an actor can choose a special trait using the special field.
     */
    get hasSpecial(): boolean {
        return ['character', 'sprite', 'spirit', 'critter'].includes(this.type);
    }

    /**
     * Determine if an actor can choose a full defense attribute
     */
    get hasFullDefense(): boolean {
        return ['character', 'vehicle', 'sprite', 'spirit', 'critter'].includes(this.type);
    }

    /**
     * Determine if an actor is awakened / magical in some kind.
     */
    get isAwakened(): boolean {
        //@ts-ignore // TODO: foundry-vtt-types v10
        return this.system.special === 'magic';
    }

    /**
     * This actor is emerged as a matrix native actor (Technomancers, Sprites)
     *
     */
    get isEmerged(): boolean {
        if (this.isSprite()) return true;
        //@ts-ignore // TODO: foundry-vtt-types v10
        if (this.isCharacter() && this.system.special === 'resonance') return true;

        return false;
    }

    /**
     * Return the full pool of a skill including attribute and possible specialization bonus.
     * @param skillId The ID of the skill. Note that this can differ from what is shown in the skill list. If you're
     *                unsure about the id and want to search
     * @param options An object to change the behaviour.
     *                The property specialization will trigger the pool value to be raised by a specialization modifier
     *                The property byLbale will cause the param skillId to be interpreted as the shown i18n label.
     */
    getPool(skillId: string, options = {specialization: false, byLabel: false}): number {
        const skill = options.byLabel ? this.getSkillByLabel(skillId) : this.getSkill(skillId);
        if (!skill || !skill.attribute) return 0;
        if (!SkillFlow.allowRoll(skill)) return 0;

        const attribute = this.getAttribute(skill.attribute);

        // An attribute can have a NaN value if no value has been set yet. Do the skill for consistency.
        const attributeValue = typeof attribute.value === 'number' ? attribute.value : 0;
        const skillValue = typeof skill.value === 'number' ? skill.value : 0;

        if (SkillRules.mustDefaultToRoll(skill) && SkillRules.allowDefaultingRoll(skill)) {
            return SkillRules.defaultingModifier + attributeValue;
        }

        const specializationBonus = options.specialization ? SR.skill.SPECIALIZATION_MODIFIER : 0;
        return skillValue + attributeValue + specializationBonus;
    }

    /**
     * Find a skill either by id or label.
     *
     * Skills are mapped by an id, which can be a either a lower case name (legacy skills) or a short uid (custom, language, knowledge).
     * Legacy skills use their name as the id, while not having a name set on the SkillField.
     * Custom skills use an id and have their name set, however no label. This goes for active, language and knowledge.
     *
     * NOTE: Normalizing skill mapping from active, language and knowledge to a single skills with a type property would
     *       clear this function up.
     *
     * @param id Either the searched id, name or translated label of a skill
     * @param options .byLabel when true search will try to match given skillId with the translated label
     */
    getSkill(id: string, options = {byLabel: false}): SkillField | undefined {
        if (options.byLabel)
            return this.getSkillByLabel(id);

        //@ts-ignore // TODO: foundry-vtt-types v10
        const {skills} = this.system;

        // Find skill by direct id to key matching.
        if (skills.active.hasOwnProperty(id)) {
            return skills.active[id];
        }
        if (skills.language.value.hasOwnProperty(id)) {
            return skills.language.value[id];
        }
        // Knowledge skills are de-normalized into categories (street, hobby, ...)
        for (const categoryKey in skills.knowledge) {
            if (skills.knowledge.hasOwnProperty(categoryKey)) {
                const category = skills.knowledge[categoryKey];
                if (category.value.hasOwnProperty(id)) {
                    return category.value[id];
                }
            }
        }
    }

    /**
     * Search all skills for a matching i18n translation label.
     * NOTE: You should use getSkill if you have the skillId ready. Only use this for ease of use!
     *
     * @param searchedFor The translated output of either the skill label (after localize) or name of the skill in question.
     * @return The first skill found with a matching translation or name.
     */
    getSkillByLabel(searchedFor: string): SkillField | undefined {
        if (!searchedFor) return;

        const possibleMatch = (skill: SkillField): string => skill.label ? game.i18n.localize(skill.label) : skill.name;

        const skills = this.getSkills();

        for (const [id, skill] of Object.entries(skills.active)) {
            if (searchedFor === possibleMatch(skill))
                return {...skill, id};
        }

        for (const [id, skill] of Object.entries(skills.language.value)) {
            if (searchedFor === possibleMatch(skill))
                return {...skill, id};
        }

        // Iterate over all different knowledge skill categories
        for (const categoryKey in skills.knowledge) {
            if (!skills.knowledge.hasOwnProperty(categoryKey)) continue;
            // Typescript can't follow the flow here...
            const categorySkills = skills.knowledge[categoryKey].value as SkillField[];
            for (const [id, skill] of Object.entries(categorySkills)) {
                if (searchedFor === possibleMatch(skill))
                    return {...skill, id};
            }
        }
    }

    /**
     * For the given skillId as it be would in the skill data structure for either
     * active, knowledge or language skill.
     * 
     * @param skillId Legacy / default skills have human-readable ids, while custom one have machine-readable.
     * @returns The label (not yet translated) OR set custom name.
     */
    getSkillLabel(skillId: string): string {
        const skill = this.getSkill(skillId);
        if (!skill) {
            return '';
        }

        return skill.label ? skill.label : skill.name ? skill.name : '';
    }

    /**
     * Add a new knowledge skill for a specific category.
     * 
     * Knowledge skills are stored separataly from active and language skills and have
     * some values pre-defined by their category (street, professional, ...)
     * 
     * @param category Define the knowledege skill category
     * @param skill  Partially define the SkillField properties needed. Omitted properties will be default.
     * @returns The id of the created knowledege skill.
     */
    async addKnowledgeSkill(category: keyof KnowledgeSkills, skill: Partial<SkillField>={name: SKILL_DEFAULT_NAME}): Promise<string|undefined> {
        //@ts-ignore // prevent accidental creation for wrong categories TODO: foundry-vtt-types v10
        if (!this.system.skills.knowledge.hasOwnProperty(category)) {
            console.error(`Shadowrun5e | Tried creating knowledge skill with unkown category ${category}`);
            return;
        }
        
        skill = DataDefaults.skillData(skill);
        const id = randomID(16);
        const value = {};
        value[id] = skill;
        const fieldName = `system.skills.knowledge.${category}.value`;
        const updateData = {};
        updateData[fieldName] = value;

        await this.update(updateData);

        return id;
    }

    /**
     * Add a new active skill.
     * 
     * @param skillData Partially define the SkillField properties needed. Omitted properties will be default.
     * @returns The new active skill id.
     */
    async addActiveSkill(skillData: Partial<SkillField> = {name: SKILL_DEFAULT_NAME}): Promise<string | undefined> {
        const skill = DataDefaults.skillData(skillData);

        const activeSkillsPath = 'system.skills.active';
        const updateSkillDataResult = Helpers.getRandomIdSkillFieldDataEntry(activeSkillsPath, skill);

        if (!updateSkillDataResult) return;

        const {updateSkillData, id} = updateSkillDataResult;

        await this.update(updateSkillData as object);

        return id;
    }

    /**
     * Remove a language skill by it's id.
     * @param skillId What skill id to delete.
     */
    async removeLanguageSkill(skillId: string) {
        const updateData = Helpers.getDeleteKeyUpdateData('system.skills.language.value', skillId);
        await this.update(updateData);
    }

    /**
     * Add a language skill.
     * 
     * @param skill Partially define the SkillField properties needed. Omitted properties will be default.
     * @returns The new language skill id.
     */
    async addLanguageSkill(skill): Promise<string> {
        const defaultSkill = {
            name: '',
            specs: [],
            base: 0,
            value: 0,
            // TODO: BUG ModifiableValue is ModList<number>[] and not number
            mod: 0,
        };
        skill = {
            ...defaultSkill,
            ...skill,
        };

        const id = randomID(16);
        const value = {};
        value[id] = skill;
        const fieldName = `system.skills.language.value`;
        const updateData = {};
        updateData[fieldName] = value;

        await this.update(updateData);

        return id;
    }

    /**
     * Remove a knowledge skill
     * @param skillId What skill id to delete.
     * @param category The matching knowledege skill category for skillId
     */
    async removeKnowledgeSkill(skillId: string, category: keyof KnowledgeSkills) {
        const updateData = Helpers.getDeleteKeyUpdateData(`system.skills.knowledge.${category}.value`, skillId);
        await this.update(updateData);
    }

    /** 
     * Delete the given active skill by it's id. It doesn't
     *
     * @param skillId Either a random id for custom skills or the skills name used as an id.
     */
    async removeActiveSkill(skillId: string) {
        const activeSkills = this.getActiveSkills();
        if (!activeSkills.hasOwnProperty(skillId)) return;
        const skill = this.getSkill(skillId);
        if (!skill) return;

        // Don't delete legacy skills to allow prepared items to use them, should the user delete by accident.
        // New custom skills won't have a label set also.
        if (skill.name === '' && skill.label !== undefined && skill.label !== '') {
            await this.hideSkill(skillId);
            // NOTE: For some reason unlinked token actors won't cause a render on update?
            //@ts-ignore // TODO: foundry-vtt-types v10
            if (!this.prototypeToken.actorLink)
                await this.sheet?.render();
            return;
        }

        // Remove custom skills without mercy!
        const updateData = Helpers.getDeleteKeyUpdateData('system.skills.active', skillId);
        await this.update(updateData);
    }

    /**
     * Mark the given skill as hidden.
     *
     * NOTE: Hiding skills has
     *
     * @param skillId The id of any type of skill.
     */
    async hideSkill(skillId: string) {
        if (!skillId) return;
        const skill = this.getSkill(skillId);
        if (!skill) return;

        skill.hidden = true;
        const updateData = Helpers.getUpdateDataEntry(`system.skills.active.${skillId}`, skill);
        await this.update(updateData);
    }

    /**
     * mark the given skill as visible.
     *
     * @param skillId The id of any type of skill.
     */
    async showSkill(skillId: string) {
        if (!skillId) return;
        const skill = this.getSkill(skillId);
        if (!skill) return;

        skill.hidden = false;
        const updateData = Helpers.getUpdateDataEntry(`system.skills.active.${skillId}`, skill);
        await this.update(updateData);
    }

    /**
     * Show all hidden skills.
     * 
     * For hidding/unhiding skill see SR5Actor#showSkill and SR5Actor#hideSkill.
     */
    async showHiddenSkills() {
        const updateData = {};

        const skills = this.getActiveSkills();
        for (const [id, skill] of Object.entries(skills)) {
            if (skill.hidden === true) {
                skill.hidden = false;
                updateData[`system.skills.active.${id}`] = skill;
            }
        }

        if (!updateData) return;

        await this.update(updateData);
        // NOTE: For some reason unlinked token actors won't cause a render on update?
        //@ts-ignore // TODO: foundry-vtt-types v10
        if (!this.prototypeToken.actorLink)
            await this.sheet?.render();
    }

    /**
     * Prompt the current user for a generic roll. 
     */
    async promptRoll() {
        await this.tests.promptSuccessTest();
    }

    /**
     * The general action process has currently no good way of injecting device ratings into the mix.
     * So, let's trick a bit.
     *
     * @param options
     */
    async rollDeviceRating(options?: ActorRollOptions) {
        const rating = this.getDeviceRating();

        const showDialog = this.tests.shouldShowDialog(options?.event);
        const testCls = this.tests._getTestClass('SuccessTest');
        const test = new testCls({}, {actor: this}, {showDialog});

        // Build pool values.
        const pool = new PartsList<number>(test.pool.mod);
        pool.addPart('SR5.Labels.ActorSheet.DeviceRating', rating);
        pool.addPart('SR5.Labels.ActorSheet.DeviceRating', rating);


        // Build modifiers values.
        const mods = new PartsList<number>(test.data.modifiers.mod);
        mods.addUniquePart('SR5.ModifierTypes.Global', this.modifiers.totalFor('global'));

        await test.execute();
    }

    /**
     * Get an action from any pack with the given name, configured for this actor and let the caller handle it..
     * 
     * @param packName The name of the item pack to search.
     * @param actionName The name within that pack.
     * @param options Success Test options
     * @returns the test instance after configuration and before it's execution.
     */
    async packActionTest(packName: PackName, actionName: PackActionName, options?: ActorRollOptions) {
        const showDialog = this.tests.shouldShowDialog(options?.event);
        return await this.tests.fromPackAction(packName, actionName, this, {showDialog});
    }

    /**
     * Roll an action from any pack with the given name.
     *
     * @param packName The name of the item pack to search.
     * @param actionName The name within that pack.
     * @param options Success Test options
     * @returns the test instance after it's been executed
     */
    async rollPackAction(packName: PackName, actionName: PackActionName, options?: ActorRollOptions) {
        const test = await this.packActionTest(packName, actionName, options);

        if (!test) return console.error('Shadowrun 5e | Rolling pack action failed');

        return await test.execute();
    }

    /**
     * Get an action as defined within the systems general action pack.
     * 
     * @param actionName The action with in the general pack.
     * @param options Success Test options 
     */
    async generalActionTest(actionName: PackActionName, options?: ActorRollOptions) {
        return await this.packActionTest(SR5.packNames.generalActions as PackName, actionName, options);
    }

    /**
     * Roll an action as defined within the systems general action pack.
     *
     * @param actionName The action with in the general pack.
     * @param options Success Test options
     */
    async rollGeneralAction(actionName: PackActionName, options?: ActorRollOptions) {
        return await this.rollPackAction(SR5.packNames.generalActions as PackName, actionName, options);
    }

    /**
     * Roll a skill test for a specific skill
     * @param skillId The id or label for the skill. When using a label, the appropriate option must be set.
     * @param options Optional options to configure the roll.
     * @param options.byLabel true to search the skill by label as displayed on the sheet.
     * @param options.specialization true to configure the skill test to use a specialization.
     */
    async rollSkill(skillId: string, options: SkillRollOptions={}) {
        console.info(`Shadowrun5e | Rolling skill test for ${skillId}`);

        const action = this.skillActionData(skillId, options);
        if (!action) return;

        const showDialog = this.tests.shouldShowDialog(options.event);
        const test = await this.tests.fromAction(action, this, {showDialog});
        if (!test) return;

        await test.execute();
    }

    /**
     * Roll a general attribute test with one or two attributes.
     *
     * @param name The attributes name as defined within data
     * @param options Change general roll options.
     */
    async rollAttribute(name, options?: ActorRollOptions) {
        console.info(`Shadowrun5e | Rolling attribute ${name} test from ${this.constructor.name}`);

        // Prepare test from action.
        const action = DataDefaults.actionRollData({attribute: name, test: AttributeOnlyTest.name});
        const test = await this.tests.fromAction(action, this);
        if (!test) return;

        await test.execute();
    }

    /**
     * Is the given attribute id a matrix attribute
     * @param attribute
     */
    _isMatrixAttribute(attribute: string): boolean {
        return SR5.matrixAttributes.hasOwnProperty(attribute);
    }

    /**
     * Add matrix modifier values to the given modifier parts from whatever Value as part of 
     * matrix success test.
     * 
     * @param parts The Value.mod field as a PartsList
     * @param atts The attributes used for the success test.
     */
    _addMatrixParts(parts: PartsList<number>, atts) {
        if (Helpers.isMatrix(atts)) {
            if (!("matrix" in this.system)) return;

            // Apply general matrix modifiers based on commlink/cyberdeck status.
            const matrix = this.system.matrix;
            if (matrix.hot_sim) parts.addUniquePart('SR5.HotSim', 2);
            if (matrix.running_silent) parts.addUniquePart('SR5.RunningSilent', -2);
        }
    }

    /**
     * Remove matrix modifier values to the given modifier part
     * 
     * @param parts A Value.mod field as a PartsList
     */
    _removeMatrixParts(parts: PartsList<number>) {
        ['SR5.HotSim', 'SR5.RunningSilent'].forEach(part => parts.removePart(part));
    }

    /**
     * Build an action for the given skill id based on it's configured values.
     *
     * @param skillId Any skill, no matter if active, knowledge or language
     * @param options
     */
    skillActionData(skillId: string, options: SkillRollOptions = {}): ActionRollData|undefined {
        const byLabel = options.byLabel || false;
        const skill = this.getSkill(skillId, {byLabel});
        if (!skill) {
            console.error(`Shadowrun 5e | Skill ${skillId} is not registered of actor ${this.id}`);
            return;
        }

        // When fetched by label, getSkillByLabel will inject the id into SkillField.
        skillId = skill.id || skillId;

        // Derive limit from skill attribute.
        const attribute = this.getAttribute(skill.attribute);
        // TODO: Typing. LimitData is incorrectly typed to ActorAttributes only but including limits.
        const limit = attribute.limit as ActorAttribute|| '';
        // Should a specialization be used?
        const spec = options.specialization || false;

        return DataDefaults.actionRollData({
            skill: skillId,
            spec,
            attribute: skill.attribute,
            limit: {
                base: 0, value: 0, mod: [],
                attribute: limit,
                base_formula_operator: 'add',
            },

            test: 'SkillTest'
        });
    }

    /**
     * Override setFlag to remove the 'SR5.' from keys in modlists, otherwise it handles them as embedded keys
     * @param scope
     * @param key
     * @param value
     */
    //@ts-ignore // TODO: foundry-vtt-types v10
    setFlag(scope: string, key: string, value: any): Promise<any> {
        //@ts-ignore TODO: foundry-vtt-types v10
        const newValue = Helpers.onSetFlag(value);
        return super.setFlag(scope, key, newValue);
    }

    /**
     * Override getFlag to add back the 'SR5.' keys correctly to be handled
     * @param scope
     * @param key
     */
    //@ts-ignore // TODO: foundry-vtt-types v10
    getFlag(scope: string, key: string): any {
        //@ts-ignore TODO: foundry-vtt-types v10
        const data = super.getFlag(scope, key);
        return Helpers.onGetFlag(data);
    }

    /** Return either the linked token or the token of the synthetic actor.
     *
     * @retrun Will return null should no token have been placed on scene.
     */
    getToken(): TokenDocument | null {
        // Linked actors can only have one token, which isn't stored within actor data...
        if (this._isLinkedToToken() && this.hasToken()) {
            const linked = true;
            const tokens = this.getActiveTokens(linked) as unknown as Token[];
            // This assumes for a token to exist and should fail if not.
            return tokens[0].document;
        }

        // Unlinked actors can have multiple active token but each have theirs directly attached...
        return this.token;
    }

    /**
     * There is no need for a token to placed. The prototype token is enough.
     */
    _isLinkedToToken(): boolean {
        //@ts-ignore // TODO: foundry-vtt-types v10
        // If an actor is linked, all it's copies also contain this linked status, even if they're not.
        return this.prototypeToken.actorLink && !this.token;
    }

    hasToken(): boolean {
        return this.getActiveTokens().length > 0;
    }

    hasActivePlayerOwner(): boolean {
        const players = this.getActivePlayerOwners();
        return players.length > 0;
    }

    getActivePlayer(): User | null {
        if (!game.users) return null;
        if (!this.hasPlayerOwner) return null;

        for (const user of game.users.contents) {
            if (!user.active || user.isGM) {
                continue;
            }
            if (this.id === user.character?.id) {
                return user;
            }
        }

        return null;
    }

    getActivePlayerOwners(): User[] {
        // @ts-ignore
        return Helpers.getPlayersWithPermission(this, 'OWNER', true);
    }

    __addDamageToTrackValue(damage: DamageData, track: TrackType | OverflowTrackType | ConditionData): TrackType | OverflowTrackType | ConditionData {
        if (damage.value === 0) return track;
        if (track.value === track.max) return track;

        //  Avoid cross referencing.
        // @ts-ignore
        track = duplicate(track);

        track.value += damage.value;
        if (track.value > track.max) {
            // dev error, not really meant to be ever seen by users. Therefore no localization.
            console.error("Damage did overflow the track, which shouldn't happen at this stage. Damage has been set to max. Please use applyDamage.")
            track.value = track.max;
        }

        return track;
    }

    async _addDamageToDeviceTrack(damage: DamageData, device: SR5Item) {
        if (!device) return;

        let condition = device.getCondition();
        if (!condition) return damage;

        if (damage.value === 0) return;
        if (condition.value === condition.max) return;

        condition = this.__addDamageToTrackValue(damage, condition);

        const updateData = {['system.technology.condition_monitor']: condition};
        await device.update(updateData);
    }

    async _addDamageToTrack(damage: DamageData, track: TrackType | OverflowTrackType | ConditionData) {
        if (damage.value === 0) return;
        if (track.value === track.max) return;

        track = this.__addDamageToTrackValue(damage, track);
        const updateData = {[`system.track.${damage.type.value}`]: track};
        await this.update(updateData);
    }

    async _addDamageToOverflow(damage: DamageData, track: OverflowTrackType) {
        if (damage.value === 0) return;
        if (track.overflow.value === track.overflow.max) return;

        //  Avoid cross referencing.
        const overflow = duplicate(track.overflow);

        // Don't over apply damage to the track overflow.
        overflow.value += damage.value;
        overflow.value = Math.min(overflow.value, overflow.max);

        const updateData = {[`system.track.${damage.type.value}.overflow`]: overflow};
        await this.update(updateData);
    }

    /**
     * Heal damage on a given damage track. Be aware that healing damage doesn't equate to recovering damage
     * and will not adhere to the recovery rules.
     *
     * @param track What track should be healed?
     * @param healing How many boxes of healing should be done?
     */
    async healDamage(track: DamageType, healing: number) {
        console.log(`Shadowrun5e | Healing ${track} damage of ${healing} for actor`, this);

        // @ts-ignore
        if (!this.system?.track.hasOwnProperty(track)) return

        // @ts-ignore
        const current = Math.max(this.system.track[track].value - healing, 0);

        await this.update({[`system.track.${track}.value`]: current});
    }

    async healStunDamage(healing: number) {
        await this.healDamage('stun', healing);
    }

    async healPhysicalDamage(healing: number) {
        await this.healDamage('physical', healing);
    }

    get canRecoverPhysicalDamage(): boolean {
        const stun = this.getStunTrack();
        if (!stun) return false
        return RecoveryRules.canHealPhysicalDamage(stun.value);
    }

    /** Apply damage to the stun track and get overflow damage for the physical track.
     */
    async addStunDamage(damage: DamageData): Promise<DamageData> {
        if (damage.type.value !== 'stun') return damage;

        const track = this.getStunTrack();
        if (!track)
            return damage;

        const {overflow, rest} = this._calcDamageOverflow(damage, track);

        // Only change damage type when needed, in order to avoid confusion of callers.
        if (overflow.value > 0) {
            // Apply Stun overflow damage to physical track according to: SR5E#170
            overflow.value = Math.floor(overflow.value / 2);
            overflow.type.value = 'physical';
        }

        await this._addDamageToTrack(rest, track);
        return overflow;
    }

    async addPhysicalDamage(damage: DamageData) {
        if (damage.type.value !== 'physical') return damage;

        const track = this.getPhysicalTrack();
        if (!track)
            return damage;

        const {overflow, rest} = this._calcDamageOverflow(damage, track);

        await this._addDamageToTrack(rest, track);
        await this._addDamageToOverflow(overflow, track);
    }

    /**
     * Matrix damage can be added onto different tracks:
     * - IC has a local matrix.condition_monitor
     * - Characters have matrix devices (items) with their local track
     */
    async addMatrixDamage(damage: DamageData): Promise<DamageData> {
        if (damage.type.value !== 'matrix') return damage;


        const device = this.getMatrixDevice();
        const track = this.getMatrixTrack();
        if (!track) return damage;

        const {overflow, rest} = this._calcDamageOverflow(damage, track);

        if (device) {
            await this._addDamageToDeviceTrack(rest, device);
        }
        if (this.isIC() || this.isSprite()) {
            await this._addDamageToTrack(rest, track);
        }


        // Return overflow for consistency, yet nothing will take overflowing matrix damage.
        return overflow;
    }

    /**
     * Apply damage of any type to this actor.
     * 
     * @param damage Damage to be applied
     * @returns overflow damage.
     */
    async addDamage(damage: DamageData): Promise<DamageData|undefined> {
        switch(damage.type.value) {
            case 'matrix':
                return await this.addMatrixDamage(damage);
            case 'stun':
                return await this.addStunDamage(damage);
            case 'physical':
                return await this.addPhysicalDamage(damage);
        }

        console.error('Shadowrun 5e | Actor does not support given damage type: ', damage);

        // TODO: Add automated combat ini score modifier here.
    }

    /**
     * Directly set the matrix damage track of this actor to a set amount.
     *
     * This is mainly used for manual user input on an actor sheet.
     *
     * This is done by resetting all tracked damage and applying one manual damage set.
     *
     * @param value The matrix damage to be applied.
     */
    async setMatrixDamage(value: number) {
        // Disallow negative values.
        value = Math.max(value, 0);

        // Use artificial damage to be consistent across other damage application Actor methods.
        const damage = DataDefaults.damageData({
            type: {base: 'matrix', value: 'matrix'},
            base: value,
            value: value
        });

        let track = this.getMatrixTrack();
        if (!track) return;

        // Reduce track to minimal value and simply add new damage.
        track.value = 0;
        // As track has been reduced to zero already, setting it to zero is already done.
        if (value > 0)
            track = this.__addDamageToTrackValue(damage, track);

        // If a matrix device is used, damage that instead of the actor.
        const device = this.getMatrixDevice();
        if (device) {
            return await device.update({'system.technology.condition_monitor': track});
        }

        // IC actors use a matrix track.
        if (this.isIC()) {
            return await this.update({'system.track.matrix': track});
        }

        // Emerged actors use a personal device like condition monitor.
        if (this.isMatrixActor) {
            return await this.update({'system.matrix.condition_monitor': track});
        }
    }

    /** Calculate damage overflow only based on max and current track values.
     */
    _calcDamageOverflow(damage: DamageData, track: TrackType | ConditionData): { overflow: DamageData, rest: DamageData } {
        const freeTrackDamage = track.max - track.value;
        const overflowDamage = damage.value > freeTrackDamage ?
            damage.value - freeTrackDamage :
            0;
        const restDamage = damage.value - overflowDamage;

        //  Avoid cross referencing.
        const overflow = duplicate(damage);
        const rest = duplicate(damage);

        overflow.value = overflowDamage;
        rest.value = restDamage;

        // @ts-ignore
        return {overflow, rest};
    }

    getStunTrack(): TrackType | undefined {
        //@ts-ignore // TODO: foundry-vtt-types v10
        if ("track" in this.system && "stun" in this.system.track)
            //@ts-ignore // TODO: foundry-vtt-types v10
            return this.system.track.stun;
    }

    getPhysicalTrack(): OverflowTrackType | undefined {
        //@ts-ignore // TODO: foundry-vtt-types v10
        if ("track" in this.system && "physical" in this.system.track)
            //@ts-ignore // TODO: foundry-vtt-types v10
            return this.system.track.physical;
    }

    /**
     * The matrix depends on actor type and possibly equipped matrix device.
     *
     * Use this method for whenever you need to access this actors matrix damage track as it's source might differ.
     */
    getMatrixTrack(): ConditionData | undefined {
        // Some actors will have a direct matrix track.
        //@ts-ignore // TODO: foundry-vtt-types v10
        if ("track" in this.system && "matrix" in this.system.track) {
            //@ts-ignore // TODO: foundry-vtt-types v10
            return this.system.track.matrix;
        }

        // Some actors will have a personal matrix condition monitor, like a device condition monitor.
        if (this.isMatrixActor) {
            // @ts-ignore isMatrixActor checks for the matrix attribute
            return this.system.matrix.condition_monitor;
        }

        // Fallback to equipped matrix device.
        const device = this.getMatrixDevice();
        if (!device) return undefined;

        return device.getCondition();
    }

    getModifiedArmor(damage: DamageData): ActorArmorData {
        if (!damage.ap?.value) {
            return this.getArmor();
        }

        const modified = duplicate(this.getArmor());
        if (modified) {
            // @ts-ignore
            modified.mod = PartsList.AddUniquePart(modified.mod, 'SR5.DV', damage.ap.value);
            // @ts-ignore
            modified.value = Helpers.calcTotal(modified, {min: 0});
        }

        // @ts-ignore
        return modified;
    }

    /** Reduce the initiative of the actor in the currently open / selected combat.
     * Should a tokens actor be in multiple combats it will also only affect the currently open combat,
     * since that is what's set in game.combat
     *
     * TODO: There is an issue with linked actors that have multiple tokens placed, with each in different combats.
     *       The defense test needs to be done using the correct token, not just by the actor (from the sidebar).
     *       One could argue this to be correct behavior, just confusing with normal linked actor / token usage.
     */
    async changeCombatInitiative(modifier: number) {
        // No change needed for nothing to change.
        if (modifier === 0) return;

        const combat: SR5Combat = game.combat as unknown as SR5Combat;
        const combatant = combat.getActorCombatant(this);

        // Token might not be part of active combat.
        if (!combatant) return;
        if (!combatant.initiative) return;

        // While not prohibiting, inform user about missing ressource.
        if (combatant.initiative + modifier < 0) {
            ui.notifications?.warn('SR5.MissingRessource.Initiative', {localize: true});
        }

        await combat.adjustInitiative(combatant, modifier);
    }

    /**
     * Determine if this actor is an active combatant.
     * 
     * @returns true, when active. false, when not in combat.
     */
    get combatActive(): boolean {
        if (!game.combat) return false;
        const combatant = (game.combat as SR5Combat).getActorCombatant(this);
        if (!combatant) return false;
        if (!combatant.initiative) return false;

        return true;
    }

    get combatant(): Combatant | undefined {
        if (!this.combatActive) return;
        return (game.combat as SR5Combat).getActorCombatant(this);
    }

    /**
     * Return the initiative score for a currently active combat
     * 
     * @returns The score or zero.
     */
    get combatInitiativeScore(): number {
        const combatant = (game.combat as SR5Combat).getActorCombatant(this);
        if (!combatant || !combatant.initiative) return 0;
        return combatant.initiative;
    }

    hasDamageTracks(): boolean {
        //@ts-ignore // TODO: foundry-vtt-types v10
        return "track" in this.system;
    }

    //@ts-ignore // TODO: foundry-vtt-types v10 - will return the item 
    asVehicle(): VehicleActorData | undefined {
        if (this.isVehicle())
            return this.data as VehicleActorData;
    }

    //@ts-ignore // TODO: foundry-vtt-types v10 - will return the item 
    asCharacter(): CharacterActorData | undefined {
        if (this.isCharacter())
            return this.data as CharacterActorData;
    }

    //@ts-ignore // TODO: foundry-vtt-types v10 - will return the item 
    asSpirit(): SpiritActorData | undefined {
        if (this.isSpirit()) {
            return this.data as SpiritActorData;
        }
    }

    //@ts-ignore // TODO: foundry-vtt-types v10 - will return the item 
    asSprite(): SpriteActorData | undefined {
        if (this.isSprite()) {
            return this.data as SpriteActorData;
        }
    }

    //@ts-ignore // TODO: foundry-vtt-types v10 - will return the item 
    asCritter(): CritterActorData | undefined {
        if (this.isCritter()) {
            return this.data as CritterActorData;
        }
    }

    //@ts-ignore // TODO: foundry-vtt-types v10 - will return the item 
    asIC(): ICActorData | undefined {
        if (this.isIC()) {
            return this.data as ICActorData;
        }
    }

    getVehicleStats(): VehicleStats | undefined {
        //@ts-ignore // TODO: foundry-vtt-types v10
        if (this.isVehicle() && "vehicle_stats" in this.system) {
            //@ts-ignore // TODO: foundry-vtt-types v10
            return this.system.vehicle_stats;
        }
    }

    /** Add another actor as the driver of a vehicle to allow for their values to be used in testing.
     *
     * @param uuid An actors id. Should be a character able to drive a vehicle
     */
    async addVehicleDriver(uuid: string) {
        if (!this.isVehicle()) return;

        const driver = await fromUuid(uuid) as SR5Actor;
        if (!driver) return;

        // NOTE: In THEORY almost all actor types can drive a vehicle.
        // ... drek, in theory a drone could drive another vehicle even...

        await this.update({'system.driver': driver.id});
    }

    async removeVehicleDriver() {
        if (!this.hasDriver()) return;

        await this.update({'system.driver': ''});
    }

    hasDriver(): boolean {
        const data = this.asVehicle();
        if (!data) return false;

        //@ts-ignore // TODO: foundry-vtt-types v10
        return this.system.driver.length > 0;
    }

    getVehicleDriver(): SR5Actor | undefined {
        if (!this.hasDriver()) return;
        const data = this.asVehicle();
        if (!data) return;

        //@ts-ignore // TODO: foundry-vtt-types v10
        const driver = game.actors?.get(this.system.driver) as SR5Actor;
        // If no driver id is set, we won't get an actor and should explicitly return undefined.
        if (!driver) return;
        return driver;
    }

    /**
     * Add a host to this IC type actor.
     *
     * Currently compendium hosts aren't supported.
     * Any other actor type has no use for this method.
     *
     * @param uuid The host item id
     */
    async addICHost(uuid: string) {
        if (!this.isIC()) return;

        // Check if the given item id is valid.
        const item = await fromUuid(uuid) as SR5Item;
        if (!item || !item.isHost) return;

        const host = item.asHost;
        if (!host) return;
        await this._updateICHostData(host);
    }

    async _updateICHostData(hostData: HostItemData) {
        const updateData = {
            // @ts-ignore _id is missing on internal typing...
            id: hostData._id,
            rating: hostData.system.rating,
            atts: duplicate(hostData.system.atts)
        }

        // Some host data isn't stored on the IC actor (marks) and won't cause an automatic render.
        await this.update({'system.host': updateData}, {render: false});
        await this.sheet?.render();
    }

    /**
     * Remove a connect Host item from an ic type actor.
     */
    async removeICHost() {
        if (!this.isIC()) return;

        const updateData = {
            id: null,
            rating: 0,
            atts: null
        }

        await this.update({'system.host': updateData});
    }

    /**
     * Will return true if this ic type actor has been connected to a host.
     */
    hasHost(): boolean {
        const ic = this.asIC();
        if (!ic) return false;
        //@ts-ignore // TODO: foundry-vtt-types v10
        return ic && !!ic.system.host.id;
    }

    /**
     * Get the host item connect to this ic type actor.
     */
    getICHost(): SR5Item | undefined {
        const ic = this.asIC();
        if (!ic) return;
        //@ts-ignore // TODO: foundry-vtt-types v10
        return game.items?.get(ic?.system?.host.id);
    }

    /** Check if this actor is of one or multiple given actor types
     *
     * @param types A list of actor types to check.
     */
    matchesActorTypes(types: string[]): boolean {
        return types.includes(this.type);
    }

    /** 
     * Get all situaitional modifiers from this actor.
     */
    getSituationModifiers(options?): DocumentSituationModifiers {
        const modifiers = DocumentSituationModifiers.getDocumentModifiers(this);
        modifiers.applyAll(options);
        return modifiers;
    }

    /**
     * Set all situational modifiers for this actor
     * 
     * @param modifiers The DocumentSituationModifiers instance to save source modifiers from.
     *                  The actor will not be checked, so be careful.
     */
    async setSituationModifiers(modifiers: DocumentSituationModifiers) {
        await DocumentSituationModifiers.setDocumentModifiers(this, modifiers.source);
    }

    /**
     * Check if the current actor has matrix capabilities.
     */
    get isMatrixActor(): boolean {
        //@ts-ignore // TODO: foundry-vtt-types v10
        return 'matrix' in this.system;
    }

    get matrixData(): MatrixData | undefined {
        if (!this.isMatrixActor) return;
        // @ts-ignore // isMatrixActor handles it, TypeScript doesn't know.
        return this.system.matrix as MatrixData;
    }

    /**
     * Change the amount of marks on the target by the amount of marks given, while adhering to min/max values.
     *
     *
     * @param target The Document the marks are placed on. This can be an actor (character, technomancer, IC) OR an item (Host)
     * @param marks The amount of marks to be placed
     * @param options Additional options that may be needed
     * @param options.scene The scene the actor lives on. If empty, will be current active scene
     * @param options.item The item that the mark is to be placed on
     * @param options.overwrite Replace the current marks amount instead of changing it
     */
    async setMarks(target: Token, marks: number, options?: { scene?: Scene, item?: SR5Item, overwrite?: boolean }) {
        if (!canvas.ready) return;

        if (this.isIC() && this.hasHost()) {
            return await this.getICHost()?.setMarks(target, marks, options);
        }

        if (!this.isMatrixActor) {
            ui.notifications?.error(game.i18n.localize('SR5.Errors.MarksCantBePlacedBy'));
            return console.error(`The actor type ${this.type} can't receive matrix marks!`);
        }
        if (target.actor && !target.actor.isMatrixActor) {
            ui.notifications?.error(game.i18n.localize('SR5.Errors.MarksCantBePlacedOn'));
            // @ts-ignore
            return console.error(`The actor type ${target.actor.type} can't receive matrix marks!`);
        }
        if (!target.actor) {
            return console.error(`The token ${target.name} is missing it's actor`);
        }

        // It hurt itself in confusion.
        if (this.id === target.actor.id) {
            return;
        }

        // Both scene and item are optional.
        const scene = options?.scene || canvas.scene as Scene;
        const item = options?.item;

        const markId = Helpers.buildMarkId(scene.id as string, target.id, item?.id as string);
        const matrixData = this.matrixData;

        if (!matrixData) return;

        const currentMarks = options?.overwrite ? 0 : this.getMarksById(markId);
        matrixData.marks[markId] = MatrixRules.getValidMarksCount(currentMarks + marks);

        await this.update({'system.matrix.marks': matrixData.marks});
    }

    /**
     * Remove ALL marks placed by this actor
     */
    async clearMarks() {
        const matrixData = this.matrixData;
        if (!matrixData) return;

        // Delete all markId properties from ActorData
        const updateData = {}
        for (const markId of Object.keys(matrixData.marks)) {
            updateData[`-=${markId}`] = null;
        }

        await this.update({'system.matrix.marks': updateData});
    }

    /**
     * Remove ONE mark. If you want to delete all marks, use clearMarks instead.
     */
    async clearMark(markId: string) {
        if (!this.isMatrixActor) return;

        const updateData = {}
        updateData[`-=${markId}`] = null;

        await this.update({'system.matrix.marks': updateData});
    }

    getAllMarks(): MatrixMarks | undefined {
        const matrixData = this.matrixData;
        if (!matrixData) return;
        return matrixData.marks;
    }

    /**
     * Return the amount of marks this actor has on another actor or one of their items.
     *
     * TODO: It's unclear what this method will be used for
     *       What does the caller want?
     *
     * TODO: Check with technomancers....
     *
     * @param target
     * @param item
     * @param options
     */
    getMarks(target: Token, item?: SR5Item, options?: { scene?: Scene }): number {
        if (!canvas.ready) return 0;
        if (target instanceof SR5Item) {
            console.error('Not yet supported');
            return 0;
        }
        if (!target.actor || !target.actor.isMatrixActor) return 0;


        const scene = options?.scene || canvas.scene as Scene;
        // If an actor has been targeted, they might have a device. If an item / host has been targeted they don't.
        item = item || target instanceof SR5Actor ? target.actor.getMatrixDevice() : undefined;

        const markId = Helpers.buildMarkId(scene.id as string, target.id, item?.id as string);
        return this.getMarksById(markId);
    }

    getMarksById(markId: string): number {
        return this.matrixData?.marks[markId] || 0;
    }

    /**
     * Return the actor or item that is the network controller of this actor.
     * These cases are possible:
     * - IC with a host connected will provide the host item
     * - IC without a host will provide itself
     * - A matrix actor within a PAN will provide the controlling actor
     * - A matrix actor without a PAN will provide itself
     */
    get matrixController(): SR5Actor | SR5Item {
        // In case of a broken host connection, return the IC actor.
        if (this.isIC() && this.hasHost()) return this.getICHost() || this;
        // TODO: Implement PAN
        // if (this.isMatrixActor && this.hasController()) return this.getController();

        return this;
    }

    getAllMarkedDocuments(): MarkedDocument[] {
        const marks = this.matrixController.getAllMarks();
        if (!marks) return [];

        // Deconstruct all mark ids into documents.
        // @ts-ignore
        return Object.entries(marks)
            .filter(([markId, marks]) => Helpers.isValidMarkId(markId))
            .map(([markId, marks]) => ({
                ...Helpers.getMarkIdDocuments(markId),
                marks,
                markId
            }))
    }

    /**
     * How many previous attacks has this actor been subjected to?
     * 
     * @returns A positive number or zero.
     */
    get previousAttacks(): number {
        //@ts-ignore TODO: foundry-vtt-types v10
        return Math.max(this.system.modifiers.multi_defense * -1, 0);
    }
    /**
     * Apply a new consecutive defense multiplier based on the amount of attacks given
     * 
     * @param previousAttacks Attacks within a combat turn. If left out, will guess based on current modifier.
     */
    async calculateNextDefenseMultiModifier(previousAttacks: number=this.previousAttacks) {
        console.debug('Shadowrun 5e | Applying consecutive defense modifier for. Last amount of attacks: ', previousAttacks);

        const automateDefenseMod = game.settings.get(SYSTEM_NAME, FLAGS.AutomateMultiDefenseModifier);
        if (!automateDefenseMod || !this.combatActive) return;

        const multiDefenseModi = CombatRules.defenseModifierForPreviousAttacks(previousAttacks + 1);
        await this.update({'system.modifiers.multi_defense': multiDefenseModi});
    }

    /**
     * Remove the consecutive defense per turn modifier.
     */
    async removeDefenseMultiModifier() {
        const automateDefenseMod = game.settings.get(SYSTEM_NAME, FLAGS.AutomateMultiDefenseModifier);
        if (!automateDefenseMod || !this.combatActive) return;

        if (this.system.modifiers.multi_defense === 0) return;

        console.debug('Shadowrun 5e | Removing consecutive defense modifier.', this);
        await this.update({'system.modifiers.multi_defense': 0});
    }

    /**
     * Add a firemodes recoil to the progressive recoil.
     * 
     * @param fireMode Ranged Weapon firemode used to attack with.
     */
    async addProgressiveRecoil(fireMode: Shadowrun.FireModeData) {
        const automateProgressiveRecoil = game.settings.get(SYSTEM_NAME, FLAGS.AutomateProgressiveRecoil);
        if (!automateProgressiveRecoil) return;

        if (!this.hasPhysicalBody) return;
        if (!fireMode.recoil) return;
        
        await this.addRecoil(fireMode.value);
    }

    /**
     * Add a flat value on top of existing progressive recoil
     * @param additional New recoil to be added
     */
    async addRecoil(additional: number) {
        const base = this.recoil + additional;
        await this.update({'system.values.recoil.base': base});
    }

    /**
     * Clear whatever progressive recoil this actor holds.
     */
    async clearProgressiveRecoil() {
        if (!this.hasPhysicalBody) return;
        if (this.recoil === 0) return;
        await this.update({'system.values.recoil.base': 0});
    }

    /**
     * Determinal if the actor has a physical body
     * 
     * @returns true, if the actor can interact with the physical plane
     */
    get hasPhysicalBody() {
        return this.isCharacter() || this.isCritter() || this.isSpirit() || this.isVehicle();
    }

    /**
     * Reset damage, edge, etc. and prepare this actor for a new run.
     */
    async resetRunData() {
        console.log(`Shadowrun 5e | Resetting actor ${this.name} (${this.id}) for a new run`);
        
        const updateData: Record<string, any> = {};

        if (this.isCharacter() || this.isCritter() || this.isSpirit() || this.isVehicle()) {
            updateData['system.track.physical.value'] = 0;
            updateData['system.track.physical.overflow.value'] = 0;
        }

        if (this.isCharacter() || this.isCritter() || this.isSpirit()) {
            updateData['system.track.stun.value'] = 0;
        }

        if (this.isCharacter() || this.isCritter()) {
            updateData['system.attributes.edge.uses'] = this.getEdge().value;
        }

        if (this.isMatrixActor) await this.setMatrixDamage(0);
        if (updateData) await this.update(updateData);
    }
}

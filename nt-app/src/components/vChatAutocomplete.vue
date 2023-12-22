<template>
    <div class="autocomplete">
        <input type="text" v-model="search" placeholder="Send Message"
            ref="inField" @keydown.tab.prevent @keyup="typeChat"
            @keydown.down.prevent="down" @keydown.up.prevent="up"
            @keydown.enter="sendMsg"
        />
        <div class="popup">
            <ul v-show="isOpen" class="autocomplete-results" ref="scroll">
                <li v-for="(result, i) in results" :key="i" @click="clickItem(result)"
                    class="autocomplete-result" :class="{ 'is-active': i === resultInd }"
                    ref="results"
                    >{{ `${ result.substring(0, 26)}${result.length>26?'...':''}` }}</li>
                </ul>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        items: {
            type: Array,
            required: false,
            default: () => [],
        },
        value: String,
    },
    data() {
        return {
            isOpen: false,
            results: [],
            search: '',
            name: '',
            itemI: 0,
            resultInd: 0,
            cursor: {
                start: 0,
                end: 0,
            },
            content: this.value,
        }
    },
    mounted() {
        document.addEventListener('click', this.handleClickOutside)
    },
    destroyed() {
        document.removeEventListener('click', this.handleClickOutside)
    },
    methods: {
        typeChat(event) {
            this.$emit('input', this.content)
            const cursor = event.target.selectionStart
            this.cursor.end = this.search.length
            this.items.forEach((data,i)=>{
                if ([event.key,this.search.charAt(cursor - 1)].includes(data.prefix) && data.names.length > 0) {
                    this.isOpen = true
                    this.cursor.start = cursor - 1
                    this.itemI = i
                }
            })
            if ([" ","Escape"].includes(event.key)) {
                this.exitMention()
            }
            if (event.key == "Tab") {
                if (this.search.indexOf(this.items[this.itemI].prefix) > -1) {
                    this.mentionReplace(this.results[this.resultInd])
                    this.exitMention()
                }
            }
            if (this.isOpen) {
                this.name = this.search.substring(this.cursor.start, this.cursor.end + 1)
                if (this.name.indexOf(" ") > -1) {
                    this.name = this.name.split(" ")[0]
                }
                this.filterResults()
                if (this.search.indexOf(this.items[this.itemI].prefix) < 0) {
                    this.exitMention()
                }
            } 
        },
        down() {
            if (this.resultInd < this.results.length - 1) {
                    this.resultInd++
                    this.scrollToSelected()
                }
        },
        up() {
            if (this.resultInd > 0) {
                    this.resultInd--
                    this.scrollToSelected()
                }
        },
        scrollToSelected() {
            this.$refs.results[this.resultInd].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        },
        clickItem(result) {
            this.mentionReplace(result)
            this.$refs.inField.focus()
            this.exitMention()
        },
        clickElse(event) {
            if (!this.$el.contains(event.target)) {
            this.exitMention()
            }
        },
        filterResults() {
            this.results = this.items[this.itemI].names.filter((item) => {
            return item.toLowerCase().indexOf(this.name.toLowerCase()) > -1
            })
        },
        exitMention() {
            this.isOpen = false
            this.resultInd = 0
            this.cursor.start = 0
            this.cursor.end = 0
            this.itemI = 0
        },
        mentionReplace(mention) {
            console.log(this.search.substring(this.cursor.start))
            const replaced = this.search.substring(this.cursor.start).replace(this.name,mention)
            const saved = this.search.substring(0, this.cursor.start)
            const pos = this.cursor.start+mention.length
            this.search = saved + replaced
            this.$nextTick(() => {
                this.$refs.inField.setSelectionRange(pos, pos)
            })
        },
        sendMsg() {
            this.$emit('input', this.search)
            this.search = ''
            this.exitMention()
        },
    },
}
</script>

<style>
.popup {
    position: relative;
    width: 0;
    height: 0;
}
.autocomplete-results {
    padding: 0;
    margin: 0;
    border: 1px solid #eeeeee;
    max-height: 8em;
    max-width: 16em;
    overflow: auto;
    white-space: nowrap;
    position: absolute;
    bottom: 0px;
    right: 0px;
    background: rgb(40, 40, 40);
}

.autocomplete-result {
    list-style: none;
    text-align: left;
    padding: 4px 2px;
    cursor: pointer;
}

.autocomplete-result.is-active,
.autocomplete-result:hover {
    background-color:hsl(0, 0%, 25%);
    color: white;
}

.autocomplete {
    display: flex;
    width: 100%;
}

.autocomplete > input {
    margin: 0;
    padding: 0.5em;
    width: 100%;
    background: transparent;
    border: none;
    background: rgb(34, 34, 34);
    transition: all 0.2s;
}

.autocomplete > input:focus {
    box-shadow: none;
    outline: none;
    background-position: 0 0;
    background: rgb(14, 14, 14);
}

</style>
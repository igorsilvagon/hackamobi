// script for the catalog
// $(document).ready(function(){

var searcher;

d3.csv("/hackemtu-data-catalog/assets/hackemtu-data-catalog.csv", function callback(data){
    // sort data by title
   // data.sort(function(a, b) {
   //     return a.title > b.title;
   // });

    // create a new Searcher object to store all this
    searcher = new Searcher(data);

    // load it
    searcher.runSearch();

    // if there's something in the URL string that indicates searching, go for it
    var searchTerm = getURLParameter("q");
    var searchCategory = getURLParameter("category");
    var searchType = getURLParameter("type");
    var searchTags = getURLParameter("tags");

    if (searchTerm || searchCategory || searchType || searchTags) {
        // run search

        searcher.setParameters({
            term: searchTerm,
            category: searchCategory,
            type: searchType,
            tags: searchTags
        });

        // put into search bar
        if (searchTerm) {
            $('#catalog-search-text').val(searchTerm);
        }

        // if there's a category, highlight the relevant list item
        if (searchCategory) {
            $('#filter-category-' + searchCategory).addClass("active");
            var category_desc = "";
            if (searchCategory == "emtu") {
                category_desc = 'Nota: A EMTU disponibiliza os dados operacionais dos ônibus metropolitanos atuantes nas cinco das seis regiões metropolitanas do Estado de São Paulo. Será distribuido para cada equipe uma senha de acesso aos dados da EMTU.';
            }

            $('#category-desc').text(category_desc)
        }

        // if there's a category, highlight the relevant list item
        if (searchType) {
            $('#filter-type-' + searchType).addClass("active")
        }


    }
});

// catch submitting the search form
// $('#catalog-search-form').on('submit', function(){
//     var searchQueryText = $('#catalog-search-text').val();
//
//     var query = {
//         text: searchQueryText
//     };
//
//     // execute search
//     searchCatalog(query, catalogData);
//
//     return false;
// });

// auto-search when someone types
// FIXME: doesn't work on IE8 and below :(
var searchFunction = function(){
    var searchQueryTerm = $('#catalog-search-text').val();

    searcher.setParameters({
        term: searchQueryTerm
    });
};
// throttle searching b/c people type faster than we can respond
var throttledSearch = _.throttle(searchFunction, 100);
$('#catalog-search-text').on('input propertychange', throttledSearch);

/**
 * Searches the data catalog based on specified fields.
 * @param  {Object} query   contains criteria that are AND'ed together:
 *                              `text`: whether the title/description contain a string
 *                              `type`: whether the type matches the given string
 * @param {Object[]} allData    an array of all datasets you want to search over
 * @return {Object[]}       an array of datasets to show
 */
function searchCatalog(query, allData) {
    // if no query, just return everything
    if (!query) {
        return allData;
    }

    var displayData = allData.filter(function(d) {
        // basically, exclude a dataset if it fails any of our criteria
        // anything that doesn't fail gets passed
        // this way, we can AND together all our criteria

        // search on text (contains)
        if (query.text) {
            query.text = query.text.toLowerCase();
            if (d.title.toLowerCase().indexOf(query.text) < 0
                && d.description.toLowerCase().indexOf(query.text) < 0
                && d.tags.toLowerCase().indexOf(query.text) < 0) {
                    return false;
            }
        }

        // search on type (exact match
        if (query.type && d.type !== query.type) {
            return false;
        }

        // search on category (exact match!!)
        if (query.category && d.category !== query.category) {
            return false;
        }

        // search on tags (exact match!!)
        if (query.tags && d.tags !== query.tags) {
            return false;
        }

        return true;
    });

    updateCatalog(displayData);
}





// Get query-string parameters
// http://stackoverflow.com/questions/11582512/how-to-get-url-parameters-with-javascript/11582513#11582513
function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}



/**
 * An object that will run searches against the catalog and store state.
 * @param  {Object[]} data   the original data to search over.
 * @param  {String} term     text to look for in the titles and descriptions of data.
 * @param  {String} category one in the enumeration of categories to filter by (academics, etc)
 * @param  {String} type     one in the enumeration of filetypes (pdf, csv, etc)
 */
var Searcher = function(data, term, category, type, tags) {
    this.data = data;
    this.term = term;
    this.category = category;
    this.type = type;
    this.tags = tags;
}

Searcher.prototype.setParameters = function(parameters) {
    console.log("Setting search parameters", parameters);

    // if they provided any of the parameters, update what we have
    if (parameters.term !== undefined && parameters.term !== null) {
        this.term = parameters.term.toLowerCase();
    }
    if (parameters.category !== undefined && parameters.category !== null) {
        this.category = parameters.category;
    }
    if (parameters.type !== undefined && parameters.type !== null) {
        this.type = parameters.type;
    }
    if (parameters.tags !== undefined && parameters.tags !== null) {
        this.tags = parameters.tags;
    }

    // now run a search
    this.runSearch();
}

/**
 * The public-facing method to run a search against the contents.
 * Runs a search and updates the catalog based on the current parameters.
 */
Searcher.prototype.runSearch = function() {
    var self = this;

    var displayData = self.data.filter(function(d) {
        // basically, exclude a dataset if it fails any of our criteria
        // anything that doesn't fail gets passed
        // this way, we can AND together all our criteria

        // search on term (contains)
        if (self.term) {
            if (d.title.toLowerCase().indexOf(self.term) < 0
                && d.description.toLowerCase().indexOf(self.term) < 0
                && d.tags.toLowerCase().indexOf(self.term) < 0) {
                    return false;
            }
        }

        // search on type (exact match
        if (self.type && d.type !== self.type) {
            return false;
        }

        // search on category (exact match!!)
        if (self.category && d.category !== self.category) {
            return false;
        }

        // search on tags (exact match!!)
        if (self.tags && d.tags !== self.tags) {
            return false;
        }

        return true;
    });

    // if no results, show an error message
    if (displayData.length === 0) {
        $('#catalog-error').removeClass("hidden");
    } else {
        $('#catalog-error').addClass("hidden");
    }

    self.updateCatalog(displayData);
}

/**
* Updates the data catalog results to show the given datasets.
* ONLY FOR INTERNAL USE. Outsiders, call runSearch() instead.
* @param  {Object[]} displayData     a subset of this.data to show.
*/
Searcher.prototype.updateCatalog = function(displayData) {
    // TODO abstract out the #catalog-results so that this is generalizable
    // load entries into catalog
    var catalog = d3.select("#catalog-results")
        .selectAll("div.result")
        .data(displayData, function key(d) {
            return d.title;
        });


    catalog.exit().remove();

    // TODO use some kind of templating engine so generating this isn't as ugly
    var catalogEnter = catalog.enter();
    var catalogDiv = catalogEnter.append("div")
        .attr("class", "result panel panel-default");

    // add heading
    catalogDiv.append("div")
        .attr("class", "panel-heading")
        .append("h3")
            .attr("class", "panel-title")
            .text(function(d){
                return d.title;
            });

    // add body
    var catalogBody = catalogDiv.append("div")
        .attr("class", "panel-body");

    // text description
    catalogBody.append("div")
        .attr("class", "col-sm-8")
        .text(function(d){
            return d.description;
        })

    // download button
    catalogBody.append("div")
        .attr("class", "push-sm-2")
        .append("a")
            .attr("href", function(d) {
                return d.url;
            })
            .attr("target","_blank")
            .attr("class", "btn btn-primary pull-right")
            .text(function(d){
                if (d.type == "HTML") { return "Acessar";}
                var downloadString = "Download";
                return d.type ? (downloadString + " (" + d.type + ")") : downloadString;
        });


    // category
    catalogBody.append("div")
        .attr("class", "col-sm-12 pull")
        .append("p")
            .attr("class", "label label-info")
            .text(function(d){
                return d.category.replace("-", " ").replace(/(^|\s)[a-z\u00E0-\u00FC]/g, l => l.toUpperCase());
            });

    // tags
    catalogBody.append("div")
        .attr("class", "col-sm-12 pull")
        .html(function(d) {
            var li = ""
            var tags = d.tags.split(" ");
            var n_tags = new Set;
            for (var i = tags.length - 1; i >= 0; i--) {
                n_tags.add(tags[i].split(",")[0].toLowerCase());
            }
            var nn_tags = Array.from(n_tags).slice(0, 5);
            for (var i = nn_tags.length - 1; i >= 0; i--) {
                li += '<p class="label label-danger">' + nn_tags[i] + '</p>';
            }
            return li;
        });
}

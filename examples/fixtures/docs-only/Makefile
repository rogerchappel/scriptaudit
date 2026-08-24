validate:
	npm run check

clean:
	rm -rf tmp

publish-inline: ; npm publish

verify-inline: package.json ; npm test

build test: package.json
	npm test

export MODE := test
